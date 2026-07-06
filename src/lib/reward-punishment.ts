import { prisma } from "@/lib/prisma";
import { formatDateOnlyUtc, parseDateOnlyUtc } from "@/lib/date-only";

export const REWARD_THRESHOLD = 85;
export const PUNISHMENT_THRESHOLD = 70;

export const rewardPunishmentPeriodOptions = [
  { value: "DAILY", label: "Harian" },
  { value: "WORKWEEK", label: "Minggu kerja" },
  { value: "MONTHLY", label: "1 bulan" },
  { value: "QUARTERLY", label: "3 bulan" },
  { value: "SEMIANNUAL", label: "6 bulan" },
  { value: "YEARLY", label: "1 tahun" }
] as const;

export const rewardPunishmentGenerationModeOptions = [
  { value: "EVALUASI", label: "Evaluasi" },
  { value: "REWARD", label: "Reward" },
  { value: "PUNISHMENT", label: "Punishment" },
  { value: "REWARD_PUNISHMENT", label: "Reward + Punishment" }
] as const;

export type RewardPunishmentPeriodKind =
  (typeof rewardPunishmentPeriodOptions)[number]["value"];
export type RewardPunishmentGenerationMode =
  (typeof rewardPunishmentGenerationModeOptions)[number]["value"];
export type RewardPunishmentCandidateType =
  | "EVALUASI"
  | "REWARD"
  | "PUNISHMENT";

export type RecommendationCandidate = {
  officerId: string;
  officerName: string;
  officerNip: string;
  unitId: string | null;
  unitName: string | null;
  triggerScore: number;
  presentAssessmentCount: number;
  type: RewardPunishmentCandidateType;
};

export type RecommendationPeriod = {
  periodKind: RewardPunishmentPeriodKind;
  referenceDate: Date;
  periodStart: Date;
  periodEnd: Date;
};

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function subtractDays(date: Date, days: number) {
  return addDays(date, -days);
}

function startOfWorkWeek(date: Date) {
  return subtractDays(date, 4);
}

function getPreviousOrSameFriday(date: Date) {
  const result = new Date(date);
  const day = result.getUTCDay();
  const diff = day >= 5 ? day - 5 : day + 2;
  return subtractDays(result, diff);
}

function getPeriodLengthDays(periodKind: RewardPunishmentPeriodKind) {
  switch (periodKind) {
    case "DAILY":
      return 1;
    case "MONTHLY":
      return 30;
    case "QUARTERLY":
      return 90;
    case "SEMIANNUAL":
      return 180;
    case "YEARLY":
      return 365;
    default:
      return 1;
  }
}

export function resolveRecommendationType(score: number) {
  if (score >= REWARD_THRESHOLD) {
    return "REWARD" as const;
  }

  if (score <= PUNISHMENT_THRESHOLD) {
    return "PUNISHMENT" as const;
  }

  return null;
}

export function buildRecommendationPeriod(
  periodKind: RewardPunishmentPeriodKind,
  referenceDateInput: string
): RecommendationPeriod {
  const parsedReferenceDate = parseDateOnlyUtc(referenceDateInput);

  if (periodKind === "WORKWEEK") {
    const effectiveFriday = getPreviousOrSameFriday(parsedReferenceDate);
    const periodStart = startOfWorkWeek(effectiveFriday);

    return {
      periodKind,
      referenceDate: effectiveFriday,
      periodStart,
      periodEnd: effectiveFriday
    };
  }

  const referenceDate = parsedReferenceDate;
  const lengthDays = getPeriodLengthDays(periodKind);
  const periodStart =
    periodKind === "DAILY"
      ? referenceDate
      : subtractDays(referenceDate, lengthDays - 1);

  return {
    periodKind,
    referenceDate,
    periodStart,
    periodEnd: referenceDate
  };
}

export function getRewardPunishmentTypeLabel(
  type: RewardPunishmentCandidateType
) {
  if (type === "EVALUASI") {
    return "Evaluasi";
  }

  if (type === "REWARD") {
    return "Reward";
  }

  return "Punishment";
}

export function getRewardPunishmentPeriodKindLabel(
  periodKind: RewardPunishmentPeriodKind
) {
  return (
    rewardPunishmentPeriodOptions.find((option) => option.value === periodKind)
      ?.label ?? periodKind
  );
}

export function formatRecommendationPeriodLabel(params: {
  periodKind: RewardPunishmentPeriodKind;
  periodStart: string | Date;
  periodEnd: string | Date;
}) {
  const periodStart = formatDateOnlyUtc(params.periodStart);
  const periodEnd = formatDateOnlyUtc(params.periodEnd);
  const periodLabel = getRewardPunishmentPeriodKindLabel(params.periodKind);

  if (periodStart === periodEnd) {
    return `${periodLabel} · ${periodStart}`;
  }

  return `${periodLabel} · ${periodStart} s.d. ${periodEnd}`;
}

export async function getRecommendationCandidates(params: {
  periodKind: RewardPunishmentPeriodKind;
  referenceDate: string;
  generationMode: RewardPunishmentGenerationMode;
}) {
  const { periodKind, referenceDate, generationMode } = params;
  const period = buildRecommendationPeriod(periodKind, referenceDate);

  const groupedAssessments = await prisma.dailyAssessment.groupBy({
    by: ["officerId"],
    where: {
      status: "PRESENT",
      assessmentDate: {
        gte: period.periodStart,
        lte: period.periodEnd
      },
      averageScore: {
        not: null
      }
    },
    _avg: {
      averageScore: true
    },
    _count: {
      id: true
    }
  });

  const aggregatedCandidates = groupedAssessments
    .map((item) => ({
      officerId: item.officerId,
      triggerScore: Number((item._avg.averageScore ?? 0).toFixed(2)),
      presentAssessmentCount: item._count.id
    }))
    .filter((item) => item.presentAssessmentCount > 0);

  if (!aggregatedCandidates.length) {
    return {
      ...period,
      candidates: [] as RecommendationCandidate[]
    };
  }

  const officers = await prisma.officer.findMany({
    where: {
      id: {
        in: aggregatedCandidates.map((item) => item.officerId)
      }
    },
    include: {
      unit: true
    }
  });

  const officerMap = new Map(officers.map((item) => [item.id, item]));
  const candidates: RecommendationCandidate[] = [];

  aggregatedCandidates.forEach((item) => {
    const officer = officerMap.get(item.officerId);

    if (!officer) {
      return;
    }

    const baseCandidate = {
      officerId: item.officerId,
      officerName: officer.name,
      officerNip: officer.nip,
      unitId: officer.unitId,
      unitName: officer.unit?.name ?? null,
      triggerScore: item.triggerScore,
      presentAssessmentCount: item.presentAssessmentCount
    };

    if (generationMode === "EVALUASI") {
      candidates.push({
        ...baseCandidate,
        type: "EVALUASI"
      });
      return;
    }

    const resolvedType = resolveRecommendationType(item.triggerScore);

    if (!resolvedType) {
      return;
    }

    if (generationMode === "REWARD" && resolvedType !== "REWARD") {
      return;
    }

    if (generationMode === "PUNISHMENT" && resolvedType !== "PUNISHMENT") {
      return;
    }

    if (
      generationMode === "REWARD_PUNISHMENT" &&
      resolvedType !== "REWARD" &&
      resolvedType !== "PUNISHMENT"
    ) {
      return;
    }

    candidates.push({
      ...baseCandidate,
      type: resolvedType
    });
  });

  return {
    ...period,
    candidates: candidates.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }

      if (a.type === "REWARD") {
        return b.triggerScore - a.triggerScore;
      }

      if (a.type === "PUNISHMENT") {
        return a.triggerScore - b.triggerScore;
      }

      return b.triggerScore - a.triggerScore;
    })
  };
}

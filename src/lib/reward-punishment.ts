import { prisma } from "@/lib/prisma";

export const REWARD_THRESHOLD = 8;
export const PUNISHMENT_THRESHOLD = 4;

export type MonthlyRecommendationCandidate = {
  officerId: string;
  officerName: string;
  officerNip: string;
  unitId: string | null;
  unitName: string | null;
  triggerScore: number;
  presentAssessmentCount: number;
  type: "REWARD" | "PUNISHMENT";
};

export function isMonthInput(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export function toMonthPeriod(value: string) {
  if (!isMonthInput(value)) {
    throw new Error("Format periode harus YYYY-MM.");
  }

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  const periodStart = new Date(year, monthIndex, 1);
  const periodEnd = new Date(year, monthIndex + 1, 0);

  return {
    periodStart,
    periodEnd
  };
}

export function toMonthInputValue(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
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

export async function getMonthlyRecommendationCandidates(period: string) {
  const { periodStart, periodEnd } = toMonthPeriod(period);

  const groupedAssessments = await prisma.dailyAssessment.groupBy({
    by: ["officerId"],
    where: {
      status: "PRESENT",
      assessmentDate: {
        gte: periodStart,
        lte: periodEnd
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

  const candidates = groupedAssessments
    .map((item) => {
      const triggerScore = Number((item._avg.averageScore ?? 0).toFixed(2));
      const type = resolveRecommendationType(triggerScore);

      if (!type) {
        return null;
      }

      return {
        officerId: item.officerId,
        triggerScore,
        presentAssessmentCount: item._count.id,
        type
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (!candidates.length) {
    return {
      periodStart,
      periodEnd,
      candidates: [] as MonthlyRecommendationCandidate[]
    };
  }

  const officers = await prisma.officer.findMany({
    where: {
      id: {
        in: candidates.map((item) => item.officerId)
      }
    },
    include: {
      unit: true
    }
  });

  const officerMap = new Map(officers.map((item) => [item.id, item]));

  return {
    periodStart,
    periodEnd,
    candidates: candidates
      .map((item) => {
        const officer = officerMap.get(item.officerId);

        if (!officer) {
          return null;
        }

        return {
          officerId: item.officerId,
          officerName: officer.name,
          officerNip: officer.nip,
          unitId: officer.unitId,
          unitName: officer.unit?.name ?? null,
          triggerScore: item.triggerScore,
          presentAssessmentCount: item.presentAssessmentCount,
          type: item.type
        };
      })
      .filter((item): item is MonthlyRecommendationCandidate => item !== null)
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }

        if (a.type === "REWARD") {
          return b.triggerScore - a.triggerScore;
        }

        return a.triggerScore - b.triggerScore;
      })
  };
}

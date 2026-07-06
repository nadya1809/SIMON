import { PrismaClient } from "@prisma/client";
import { calculateAverageScore } from "@/lib/scoring";
import { formatDateOnlyUtc, parseDateOnlyUtc } from "@/lib/date-only";
import {
  getRecommendationCandidates,
  PUNISHMENT_THRESHOLD,
  REWARD_THRESHOLD
} from "@/lib/reward-punishment";

const prisma = new PrismaClient();

const SEED_TAG = "[SEED-3M-ASSESSMENTS]";

type OfficerProfile = "REWARD" | "NEUTRAL_HIGH" | "NEUTRAL" | "PUNISHMENT";

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getQuarterRange(referenceDateInput?: string) {
  const referenceDate = referenceDateInput
    ? parseDateOnlyUtc(referenceDateInput)
    : parseDateOnlyUtc(formatDateOnlyUtc(new Date()));
  const startDate = addDays(referenceDate, -89);

  return {
    referenceDate,
    startDate,
    endDate: referenceDate
  };
}

function getOfficerProfile(index: number, total: number): OfficerProfile {
  const ratio = (index + 1) / total;

  if (ratio <= 0.22) {
    return "REWARD";
  }

  if (ratio <= 0.55) {
    return "NEUTRAL_HIGH";
  }

  if (ratio <= 0.84) {
    return "NEUTRAL";
  }

  return "PUNISHMENT";
}

function getBaseScore(profile: OfficerProfile) {
  switch (profile) {
    case "REWARD":
      return 91;
    case "NEUTRAL_HIGH":
      return 81;
    case "NEUTRAL":
      return 75;
    case "PUNISHMENT":
      return 59;
  }
}

function getCriterionOffset(index: number) {
  const offsets = [3, 2, 1, 0, 1, -1, -2];
  return offsets[index % offsets.length];
}

function clampScore(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function isAbsentDay(date: Date, officerIndex: number) {
  const day = date.getUTCDay();

  if (day === 0) {
    return true;
  }

  if (day === 6 && officerIndex % 3 === 0) {
    return true;
  }

  return false;
}

function buildScores(params: {
  criteriaCount: number;
  officerIndex: number;
  dayIndex: number;
  profile: OfficerProfile;
}) {
  const { criteriaCount, officerIndex, dayIndex, profile } = params;
  const baseScore = getBaseScore(profile);
  const dayWave = (dayIndex % 6) - 2;
  const weeklyWave = (Math.floor(dayIndex / 7) % 4) - 1;
  const officerOffset = (officerIndex % 5) - 2;

  return Array.from({ length: criteriaCount }, (_, criteriaIndex) =>
    clampScore(
      baseScore +
        getCriterionOffset(criteriaIndex) +
        dayWave +
        weeklyWave +
        officerOffset
    )
  );
}

async function main() {
  const { referenceDate, startDate, endDate } = getQuarterRange(
    process.env.SEED_ASSESSMENT_REFERENCE_DATE
  );

  const [actor, activeOfficers, activeCriteria] = await Promise.all([
    prisma.user.findFirst({
      where: { isActive: true },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }]
    }),
    prisma.officer.findMany({
      where: { isActive: true },
      include: { unit: true },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }]
    }),
    prisma.criteria.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);

  if (!actor) {
    throw new Error("Tidak ada user aktif untuk menjadi assessor seed.");
  }

  if (!activeOfficers.length) {
    throw new Error("Tidak ada petugas aktif untuk diisi assessment.");
  }

  if (!activeCriteria.length) {
    throw new Error("Tidak ada kriteria aktif untuk diisi assessment.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.rewardPunishment.deleteMany({
      where: {
        referenceDate: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    await tx.dailyAssessment.deleteMany({
      where: {
        officerId: {
          in: activeOfficers.map((officer) => officer.id)
        },
        assessmentDate: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  });

  const allDates: Date[] = [];
  for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
    allDates.push(new Date(cursor));
  }

  let createdPresent = 0;
  let createdAbsent = 0;

  for (const [officerIndex, officer] of activeOfficers.entries()) {
    const profile = getOfficerProfile(officerIndex, activeOfficers.length);

    for (const [dayIndex, assessmentDate] of allDates.entries()) {
      const absent = isAbsentDay(assessmentDate, officerIndex);

      if (absent) {
        await prisma.dailyAssessment.create({
          data: {
            officerId: officer.id,
            assessorId: actor.id,
            assessmentDate,
            status: "ABSENT",
            averageScore: null,
            notes: `${SEED_TAG} ${profile} ${formatDateOnlyUtc(referenceDate)}`
          }
        });
        createdAbsent += 1;
        continue;
      }

      const scores = buildScores({
        criteriaCount: activeCriteria.length,
        officerIndex,
        dayIndex,
        profile
      });

      await prisma.dailyAssessment.create({
        data: {
          officerId: officer.id,
          assessorId: actor.id,
          assessmentDate,
          status: "PRESENT",
          averageScore: calculateAverageScore(scores),
          notes: `${SEED_TAG} ${profile} ${formatDateOnlyUtc(referenceDate)}`,
          scores: {
            create: activeCriteria.map((criteria, criteriaIndex) => ({
              criteriaId: criteria.id,
              score: scores[criteriaIndex]
            }))
          }
        }
      });
      createdPresent += 1;
    }
  }

  const recommendationSummary = await getRecommendationCandidates({
    periodKind: "QUARTERLY",
    referenceDate: formatDateOnlyUtc(referenceDate),
    generationMode: "REWARD_PUNISHMENT"
  });
  const evaluationSummary = await getRecommendationCandidates({
    periodKind: "QUARTERLY",
    referenceDate: formatDateOnlyUtc(referenceDate),
    generationMode: "EVALUASI"
  });

  const summaryByType = recommendationSummary.candidates.reduce(
    (accumulator, item) => {
      accumulator[item.type] = (accumulator[item.type] ?? 0) + 1;
      return accumulator;
    },
    {} as Record<string, number>
  );

  console.log(
    JSON.stringify(
      {
        success: true,
        message:
          "Seed assessment 3 bulan berhasil dibuat. Data siap dipakai untuk uji Evaluasi, Reward, dan Punishment.",
        range: {
          from: formatDateOnlyUtc(startDate),
          to: formatDateOnlyUtc(endDate),
          totalDays: allDates.length
        },
        totals: {
          officers: activeOfficers.length,
          criteria: activeCriteria.length,
          presentAssessments: createdPresent,
          absentAssessments: createdAbsent,
          totalAssessments: createdPresent + createdAbsent
        },
        thresholds: {
          reward: REWARD_THRESHOLD,
          punishment: PUNISHMENT_THRESHOLD
        },
        recommendations: {
          quarterlyEvaluationCandidates: evaluationSummary.candidates.length,
          quarterlyRewardPunishmentCandidates: recommendationSummary.candidates.length,
          rewardCount: summaryByType.REWARD ?? 0,
          punishmentCount: summaryByType.PUNISHMENT ?? 0
        },
        note:
          "Recommendation seed lama pada rentang tanggal ini dibersihkan agar generate ulang dari UI menghasilkan data baru yang konsisten."
      },
      null,
      2
    )
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

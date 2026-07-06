import { PrismaClient } from "@prisma/client";
import { calculateAverageScore } from "@/lib/scoring";
import { getRecommendationCandidates } from "@/lib/reward-punishment";

const prisma = new PrismaClient();

const DUMMY_TAG = "[DUMMY-RP-TEST]";

type DummyProfile = {
  label: string;
  expectedType: "REWARD" | "PUNISHMENT" | "NEUTRAL";
  scoreSets: number[][];
};

function getMonthPeriod(value?: string) {
  const source = value ? new Date(`${value}-01T00:00:00`) : new Date();
  const year = source.getFullYear();
  const monthIndex = source.getMonth();

  return {
    period: `${year}-${`${monthIndex + 1}`.padStart(2, "0")}`,
    dates: [27, 28, 29].map((day) => new Date(year, monthIndex, day))
  };
}

async function main() {
  const { period, dates } = getMonthPeriod(process.env.DUMMY_RP_PERIOD);

  const actor = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" }
  });

  if (!actor) {
    throw new Error("Tidak ada user aktif untuk membuat dummy assessment.");
  }

  const criteria = await prisma.criteria.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  if (criteria.length < 2) {
    throw new Error("Minimal harus ada 2 kriteria aktif.");
  }

  const profiles: DummyProfile[] = [
    {
      label: "Reward unggul A",
      expectedType: "REWARD",
      scoreSets: [
        [98, 94],
        [95, 93],
        [99, 97]
      ]
    },
    {
      label: "Reward unggul B",
      expectedType: "REWARD",
      scoreSets: [
        [90, 92],
        [91, 89],
        [93, 94]
      ]
    },
    {
      label: "Punishment rendah A",
      expectedType: "PUNISHMENT",
      scoreSets: [
        [58, 55],
        [60, 57],
        [54, 53]
      ]
    },
    {
      label: "Punishment rendah B",
      expectedType: "PUNISHMENT",
      scoreSets: [
        [48, 52],
        [50, 54],
        [46, 47]
      ]
    },
    {
      label: "Netral tengah A",
      expectedType: "NEUTRAL",
      scoreSets: [
        [76, 79],
        [80, 78],
        [77, 81]
      ]
    },
    {
      label: "Netral tengah B",
      expectedType: "NEUTRAL",
      scoreSets: [
        [72, 75],
        [74, 78],
        [79, 76]
      ]
    }
  ];

  const reservedDates = dates.map((date) => date.toISOString().slice(0, 10));
  const activeOfficers = await prisma.officer.findMany({
    where: {
      isActive: true,
      assessments: {
        none: {
          assessmentDate: {
            in: dates
          }
        }
      },
      rewardPunishments: {
        none: {
          periodStart: new Date(`${period}-01T00:00:00`)
        }
      }
    },
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    take: profiles.length,
    include: {
      unit: true
    }
  });

  if (activeOfficers.length < profiles.length) {
    throw new Error(
      `Petugas aktif yang aman untuk dummy tidak cukup. Butuh ${profiles.length}, tersedia ${activeOfficers.length}. Tanggal yang dicadangkan: ${reservedDates.join(", ")}.`
    );
  }

  const selected = activeOfficers.map((officer, index) => ({
    officer,
    profile: profiles[index]
  }));

  for (const { officer, profile } of selected) {
    for (let index = 0; index < dates.length; index += 1) {
      const assessmentDate = dates[index];
      const scoreSet = profile.scoreSets[index];
      const averageScore = calculateAverageScore(scoreSet);

      const existing = await prisma.dailyAssessment.findUnique({
        where: {
          officerId_assessmentDate: {
            officerId: officer.id,
            assessmentDate
          }
        },
        include: {
          scores: true
        }
      });

      if (existing) {
        await prisma.assessmentScore.deleteMany({
          where: {
            dailyAssessmentId: existing.id
          }
        });

        await prisma.dailyAssessment.update({
          where: { id: existing.id },
          data: {
            assessorId: actor.id,
            status: "PRESENT",
            averageScore,
            notes: `${DUMMY_TAG} ${profile.label} ${period}`,
            scores: {
              create: criteria.slice(0, scoreSet.length).map((criteriaItem, scoreIndex) => ({
                criteriaId: criteriaItem.id,
                score: scoreSet[scoreIndex]
              }))
            }
          }
        });
      } else {
        await prisma.dailyAssessment.create({
          data: {
            officerId: officer.id,
            assessorId: actor.id,
            assessmentDate,
            status: "PRESENT",
            averageScore,
            notes: `${DUMMY_TAG} ${profile.label} ${period}`,
            scores: {
              create: criteria.slice(0, scoreSet.length).map((criteriaItem, scoreIndex) => ({
                criteriaId: criteriaItem.id,
                score: scoreSet[scoreIndex]
              }))
            }
          }
        });
      }
    }
  }

  const candidates = await getRecommendationCandidates({
    periodKind: "MONTHLY",
    referenceDate: reservedDates[reservedDates.length - 1],
    generationMode: "REWARD_PUNISHMENT"
  });
  const seededSummary = selected.map(({ officer, profile }) => {
    const candidate = candidates.candidates.find((item) => item.officerId === officer.id);

    return {
      officer: officer.name,
      unit: officer.unit?.name ?? "-",
      expectedType: profile.expectedType,
      actualType: candidate?.type ?? "NEUTRAL",
      triggerScore: candidate?.triggerScore ?? null
    };
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        period,
        reservedDates,
        message:
          "Dummy assessment untuk evaluasi/reward/punishment berhasil dibuat. Lanjutkan dengan klik Generate Data di UI.",
        seededSummary
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

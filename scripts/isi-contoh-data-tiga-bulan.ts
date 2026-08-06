import bcrypt from "bcryptjs";
import { PrismaClient, type RewardPunishmentPeriodKind } from "@prisma/client";
import { calculateAverageScore } from "@/lib/scoring";
import { formatDateOnlyUtc, parseDateOnlyUtc } from "@/lib/date-only";
import { getRecommendationCandidates } from "@/lib/reward-punishment";

const prisma = new PrismaClient();

const DATA_TAG = "[CONTOH-3BULAN]";
const REFERENCE_DATE_ENV = "CONTOH_REFERENCE_DATE";
const PASSWORD = "Contoh123!";

type OfficerProfile = "SANGAT_BAIK" | "BAIK" | "CUKUP" | "PERLU_PEMBINAAN";

const units = [
  {
    key: "frontline1",
    name: "Frontline 1",
    description: "Unit layanan tatap muka jalur Frontline 1."
  },
  {
    key: "frontline2",
    name: "Frontline 2",
    description: "Unit layanan tatap muka jalur Frontline 2."
  },
  {
    key: "online",
    name: "Petugas Online",
    description: "Unit layanan PST daring."
  }
] as const;

const users = [
  {
    id: "contoh-user-supervisor",
    name: "Supervisor Contoh",
    email: "supervisor.contoh@simon.local",
    role: "SUPERVISOR" as const
  },
  {
    id: "contoh-user-pimpinan",
    name: "Pimpinan Contoh",
    email: "pimpinan.contoh@simon.local",
    role: "PIMPINAN" as const
  }
] as const;

const officers = [
  {
    id: "contoh-officer-001",
    nip: "199001012020011001",
    name: "Andi Pratama Contoh",
    jabatan: "Petugas Pelayanan Statistik",
    unitKey: "frontline1",
    profile: "SANGAT_BAIK" as const
  },
  {
    id: "contoh-officer-002",
    nip: "199102022020012002",
    name: "Bunga Lestari Contoh",
    jabatan: "Petugas Pelayanan Statistik",
    unitKey: "frontline1",
    profile: "SANGAT_BAIK" as const
  },
  {
    id: "contoh-officer-003",
    nip: "199203032020013003",
    name: "Citra Dewi Contoh",
    jabatan: "Petugas Front Office",
    unitKey: "frontline2",
    profile: "BAIK" as const
  },
  {
    id: "contoh-officer-004",
    nip: "199304042020014004",
    name: "Dimas Saputra Contoh",
    jabatan: "Petugas Front Office",
    unitKey: "frontline2",
    profile: "CUKUP" as const
  },
  {
    id: "contoh-officer-005",
    nip: "199405052020015005",
    name: "Eka Maharani Contoh",
    jabatan: "Petugas Pengolahan Layanan",
    unitKey: "online",
    profile: "CUKUP" as const
  },
  {
    id: "contoh-officer-006",
    nip: "199506062020016006",
    name: "Fajar Nugroho Contoh",
    jabatan: "Petugas Pengolahan Layanan",
    unitKey: "online",
    profile: "PERLU_PEMBINAAN" as const
  }
] as const;

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getDateRange() {
  const referenceDate = process.env[REFERENCE_DATE_ENV]
    ? parseDateOnlyUtc(process.env[REFERENCE_DATE_ENV]!)
    : parseDateOnlyUtc(formatDateOnlyUtc(new Date()));

  return {
    referenceDate,
    startDate: addDays(referenceDate, -89),
    endDate: referenceDate
  };
}

function getBaseScore(profile: OfficerProfile) {
  switch (profile) {
    case "SANGAT_BAIK":
      return 91;
    case "BAIK":
      return 82;
    case "CUKUP":
      return 75;
    case "PERLU_PEMBINAAN":
      return 61;
  }
}

function clampScore(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function isAbsentDay(date: Date, officerIndex: number) {
  const day = date.getUTCDay();

  if (day === 0) {
    return true;
  }

  return day === 6 && officerIndex % 3 === 0;
}

function buildScores(params: {
  profile: OfficerProfile;
  dayIndex: number;
  officerIndex: number;
  criteriaCount: number;
}) {
  const criterionOffsets = [3, 2, 1, 0, -1, -2, 1];
  const dayWave = (params.dayIndex % 7) - 3;
  const weeklyWave = (Math.floor(params.dayIndex / 7) % 5) - 2;
  const officerOffset = (params.officerIndex % 4) - 1;

  return Array.from({ length: params.criteriaCount }, (_, index) =>
    clampScore(
      getBaseScore(params.profile) +
        criterionOffsets[index % criterionOffsets.length] +
        dayWave +
        weeklyWave +
        officerOffset
    )
  );
}

async function ensureDefaultCriteria() {
  await prisma.criteria.upsert({
    where: { id: "default-discipline-criteria" },
    update: {
      name: "Disiplin",
      description: "Penilaian kedisiplinan petugas PST.",
      sortOrder: 1,
      isActive: true
    },
    create: {
      id: "default-discipline-criteria",
      name: "Disiplin",
      description: "Penilaian kedisiplinan petugas PST.",
      sortOrder: 1,
      isActive: true
    }
  });

  await prisma.criteria.upsert({
    where: { id: "default-performance-criteria" },
    update: {
      name: "Kinerja",
      description: "Penilaian kinerja harian petugas PST.",
      sortOrder: 2,
      isActive: true
    },
    create: {
      id: "default-performance-criteria",
      name: "Kinerja",
      description: "Penilaian kinerja harian petugas PST.",
      sortOrder: 2,
      isActive: true
    }
  });
}

async function cleanupExampleData(startDate: Date, endDate: Date) {
  const officerIds = officers.map((officer) => officer.id);
  const userIds = users.map((user) => user.id);

  await prisma.notification.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { entityId: { startsWith: "contoh-" } },
        { message: { contains: DATA_TAG } }
      ]
    }
  });

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { entityId: { startsWith: "contoh-" } }
      ]
    }
  });

  await prisma.rewardPunishment.deleteMany({
    where: {
      OR: [
        { officerId: { in: officerIds } },
        {
          notes: {
            contains: DATA_TAG
          }
        },
        {
          referenceDate: {
            gte: startDate,
            lte: endDate
          },
          officerId: { in: officerIds }
        }
      ]
    }
  });

  await prisma.dailyAssessment.deleteMany({
    where: {
      OR: [
        { officerId: { in: officerIds } },
        {
          notes: {
            contains: DATA_TAG
          }
        }
      ]
    }
  });

  await prisma.officer.deleteMany({
    where: {
      id: {
        in: officerIds
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: userIds
      }
    }
  });
}

async function createRecommendations(params: {
  referenceDate: Date;
  actorId: string;
}) {
  const referenceDateText = formatDateOnlyUtc(params.referenceDate);
  const configs: Array<{
    periodKind: RewardPunishmentPeriodKind;
    generationMode: "EVALUASI" | "REWARD_PUNISHMENT";
    category: Record<"EVALUASI" | "REWARD" | "PUNISHMENT", string>;
  }> = [
    {
      periodKind: "MONTHLY",
      generationMode: "EVALUASI",
      category: {
        EVALUASI: "Evaluasi Bulanan Contoh",
        REWARD: "Reward Bulanan Contoh",
        PUNISHMENT: "Pembinaan Bulanan Contoh"
      }
    },
    {
      periodKind: "MONTHLY",
      generationMode: "REWARD_PUNISHMENT",
      category: {
        EVALUASI: "Evaluasi Bulanan Contoh",
        REWARD: "Reward Bulanan Contoh",
        PUNISHMENT: "Pembinaan Bulanan Contoh"
      }
    },
    {
      periodKind: "QUARTERLY",
      generationMode: "EVALUASI",
      category: {
        EVALUASI: "Evaluasi Triwulanan Contoh",
        REWARD: "Reward Triwulanan Contoh",
        PUNISHMENT: "Pembinaan Triwulanan Contoh"
      }
    },
    {
      periodKind: "QUARTERLY",
      generationMode: "REWARD_PUNISHMENT",
      category: {
        EVALUASI: "Evaluasi Triwulanan Contoh",
        REWARD: "Reward Triwulanan Contoh",
        PUNISHMENT: "Pembinaan Triwulanan Contoh"
      }
    }
  ];

  let totalCreated = 0;

  for (const config of configs) {
    const result = await getRecommendationCandidates({
      periodKind: config.periodKind,
      referenceDate: referenceDateText,
      generationMode: config.generationMode
    });

    for (const candidate of result.candidates) {
      await prisma.rewardPunishment.create({
        data: {
          officerId: candidate.officerId,
          type: candidate.type,
          periodKind: config.periodKind,
          referenceDate: result.referenceDate,
          category: config.category[candidate.type],
          periodStart: result.periodStart,
          periodEnd: result.periodEnd,
          triggerScore: candidate.triggerScore,
          status: "RECOMMENDED",
          notes: `${DATA_TAG} ${config.periodKind} ${config.generationMode}`,
          decidedById: params.actorId
        }
      });
      totalCreated += 1;
    }
  }

  return totalCreated;
}

async function main() {
  const { referenceDate, startDate, endDate } = getDateRange();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await ensureDefaultCriteria();
  await cleanupExampleData(startDate, endDate);

  const unitIdByKey = new Map<(typeof units)[number]["key"], string>();

  for (const unit of units) {
    const existingUnit = await prisma.unit.findFirst({
      where: { name: unit.name }
    });
    const savedUnit = existingUnit
      ? await prisma.unit.update({
          where: { id: existingUnit.id },
          data: { description: unit.description }
        })
      : await prisma.unit.create({
          data: {
            name: unit.name,
            description: unit.description
          }
        });
    unitIdByKey.set(unit.key, savedUnit.id);
  }

  for (const user of users) {
    await prisma.user.create({
      data: {
        ...user,
        passwordHash,
        isActive: true
      }
    });
  }

  for (const officer of officers) {
    await prisma.officer.create({
      data: {
        id: officer.id,
        nip: officer.nip,
        name: officer.name,
        jabatan: officer.jabatan,
        unitId: unitIdByKey.get(officer.unitKey),
        isActive: true
      }
    });
  }

  const criteria = await prisma.criteria.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  const dates: Date[] = [];
  for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
    dates.push(new Date(cursor));
  }

  let presentAssessments = 0;
  let absentAssessments = 0;

  for (const [officerIndex, officer] of officers.entries()) {
    for (const [dayIndex, assessmentDate] of dates.entries()) {
      if (isAbsentDay(assessmentDate, officerIndex)) {
        await prisma.dailyAssessment.create({
          data: {
            officerId: officer.id,
            assessorId: "contoh-user-supervisor",
            assessmentDate,
            status: "ABSENT",
            averageScore: null,
            notes: `${DATA_TAG} ${officer.profile}`
          }
        });
        absentAssessments += 1;
        continue;
      }

      const scores = buildScores({
        profile: officer.profile,
        dayIndex,
        officerIndex,
        criteriaCount: criteria.length
      });

      await prisma.dailyAssessment.create({
        data: {
          officerId: officer.id,
          assessorId: "contoh-user-supervisor",
          assessmentDate,
          status: "PRESENT",
          averageScore: calculateAverageScore(scores),
          notes: `${DATA_TAG} ${officer.profile}`,
          scores: {
            create: criteria.map((criterion, index) => ({
              criteriaId: criterion.id,
              score: scores[index]
            }))
          }
        }
      });
      presentAssessments += 1;
    }
  }

  const recommendationCount = await createRecommendations({
    referenceDate,
    actorId: "contoh-user-pimpinan"
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        message: "Contoh data 3 bulan berhasil dimasukkan.",
        loginContoh: {
          supervisor: users[0].email,
          pimpinan: users[1].email,
          password: PASSWORD
        },
        range: {
          from: formatDateOnlyUtc(startDate),
          to: formatDateOnlyUtc(endDate),
          totalDays: dates.length
        },
        totals: {
          units: units.length,
          users: users.length,
          officers: officers.length,
          criteria: criteria.length,
          presentAssessments,
          absentAssessments,
          totalAssessments: presentAssessments + absentAssessments,
          rewardPunishments: recommendationCount
        }
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

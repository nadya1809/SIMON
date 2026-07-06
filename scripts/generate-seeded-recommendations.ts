import { PrismaClient } from "@prisma/client";
import { formatDateOnlyUtc, parseDateOnlyUtc } from "@/lib/date-only";
import {
  getRecommendationCandidates,
  type RewardPunishmentGenerationMode,
  type RewardPunishmentPeriodKind
} from "@/lib/reward-punishment";
import { toAuditJson, writeAuditLog } from "@/lib/audit";

const prisma = new PrismaClient();

type GenerationConfig = {
  periodKind: RewardPunishmentPeriodKind;
  generationMode: RewardPunishmentGenerationMode;
  category: {
    evaluation: string;
    reward: string;
    punishment: string;
  };
  notes: string;
};

const configs: GenerationConfig[] = [
  {
    periodKind: "MONTHLY",
    generationMode: "EVALUASI",
    category: {
      evaluation: "Evaluasi Bulanan",
      reward: "Reward Bulanan",
      punishment: "Teguran Bulanan"
    },
    notes: "Dibuat otomatis dari seed data 3 bulan untuk pengujian evaluasi bulanan."
  },
  {
    periodKind: "MONTHLY",
    generationMode: "REWARD_PUNISHMENT",
    category: {
      evaluation: "Evaluasi Bulanan",
      reward: "Reward Bulanan",
      punishment: "Teguran Bulanan"
    },
    notes: "Dibuat otomatis dari seed data 3 bulan untuk pengujian reward/punishment bulanan."
  },
  {
    periodKind: "QUARTERLY",
    generationMode: "EVALUASI",
    category: {
      evaluation: "Evaluasi Triwulanan",
      reward: "Reward Triwulanan",
      punishment: "Pembinaan Triwulanan"
    },
    notes: "Dibuat otomatis dari seed data 3 bulan untuk pengujian evaluasi triwulanan."
  },
  {
    periodKind: "QUARTERLY",
    generationMode: "REWARD_PUNISHMENT",
    category: {
      evaluation: "Evaluasi Triwulanan",
      reward: "Reward Triwulanan",
      punishment: "Pembinaan Triwulanan"
    },
    notes: "Dibuat otomatis dari seed data 3 bulan untuk pengujian reward/punishment triwulanan."
  }
];

async function main() {
  const referenceDate = process.env.SEED_ASSESSMENT_REFERENCE_DATE
    ? parseDateOnlyUtc(process.env.SEED_ASSESSMENT_REFERENCE_DATE)
    : parseDateOnlyUtc(formatDateOnlyUtc(new Date()));

  const actor = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  });

  if (!actor) {
    throw new Error("Tidak ada user aktif untuk membuat rekomendasi seed.");
  }

  await prisma.rewardPunishment.deleteMany({
    where: {
      referenceDate
    }
  });

  const createdCounts: Array<{
    periodKind: RewardPunishmentPeriodKind;
    generationMode: RewardPunishmentGenerationMode;
    created: number;
  }> = [];

  for (const config of configs) {
    const result = await getRecommendationCandidates({
      periodKind: config.periodKind,
      referenceDate: formatDateOnlyUtc(referenceDate),
      generationMode: config.generationMode
    });

    const created = await prisma.$transaction(async (tx) => {
      const records = [];

      for (const candidate of result.candidates) {
        const category =
          candidate.type === "EVALUASI"
            ? config.category.evaluation
            : candidate.type === "REWARD"
              ? config.category.reward
              : config.category.punishment;

        const record = await tx.rewardPunishment.create({
          data: {
            officerId: candidate.officerId,
            type: candidate.type,
            periodKind: config.periodKind,
            referenceDate: result.referenceDate,
            category,
            periodStart: result.periodStart,
            periodEnd: result.periodEnd,
            triggerScore: candidate.triggerScore,
            notes: config.notes
          },
          include: {
            officer: {
              include: {
                unit: true
              }
            },
            decidedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        });

        records.push(record);
      }

      return records;
    });

    await Promise.all(
      created.map((item) =>
        writeAuditLog({
          userId: actor.id,
          action: "CREATE",
          entity: "RewardPunishment",
          entityId: item.id,
          afterData: toAuditJson(item)
        })
      )
    );

    createdCounts.push({
      periodKind: config.periodKind,
      generationMode: config.generationMode,
      created: created.length
    });
  }

  const totalRecommendations = await prisma.rewardPunishment.count({
    where: {
      referenceDate
    }
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        message:
          "Data rekomendasi Evaluasi, Reward, dan Punishment berhasil dibuat dari seed assessment 3 bulan.",
        referenceDate: formatDateOnlyUtc(referenceDate),
        totalRecommendations,
        createdCounts
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

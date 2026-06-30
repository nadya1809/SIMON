import { PrismaClient } from "@prisma/client";
import {
  buildRecommendationPeriod,
  type RewardPunishmentPeriodKind
} from "@/lib/reward-punishment";
import { formatDateOnlyUtc } from "@/lib/date-only";

const prisma = new PrismaClient();

function resolveReferenceDateInput(params: {
  periodKind: RewardPunishmentPeriodKind;
  referenceDate: Date;
  periodEnd: Date;
}) {
  if (params.periodKind === "MONTHLY") {
    return formatDateOnlyUtc(params.periodEnd);
  }

  return formatDateOnlyUtc(params.referenceDate);
}

async function main() {
  const items = await prisma.rewardPunishment.findMany({
    orderBy: [{ periodStart: "asc" }, { createdAt: "asc" }]
  });

  let repairedCount = 0;

  for (const item of items) {
    const periodKind = item.periodKind;
    const referenceDateInput = resolveReferenceDateInput({
      periodKind,
      referenceDate: item.referenceDate,
      periodEnd: item.periodEnd
    });
    const expected = buildRecommendationPeriod(periodKind, referenceDateInput);

    const currentReferenceDate = formatDateOnlyUtc(item.referenceDate);
    const currentPeriodStart = formatDateOnlyUtc(item.periodStart);
    const currentPeriodEnd = formatDateOnlyUtc(item.periodEnd);
    const expectedReferenceDate = formatDateOnlyUtc(expected.referenceDate);
    const expectedPeriodStart = formatDateOnlyUtc(expected.periodStart);
    const expectedPeriodEnd = formatDateOnlyUtc(expected.periodEnd);

    if (
      currentReferenceDate === expectedReferenceDate &&
      currentPeriodStart === expectedPeriodStart &&
      currentPeriodEnd === expectedPeriodEnd
    ) {
      continue;
    }

    await prisma.rewardPunishment.update({
      where: {
        id: item.id
      },
      data: {
        referenceDate: expected.referenceDate,
        periodStart: expected.periodStart,
        periodEnd: expected.periodEnd
      }
    });

    repairedCount += 1;
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        totalRecords: items.length,
        repairedCount,
        message:
          repairedCount > 0
            ? "Periode evaluasi/reward/punishment yang tidak sinkron berhasil dinormalisasi."
            : "Tidak ada periode evaluasi/reward/punishment yang perlu diperbaiki."
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

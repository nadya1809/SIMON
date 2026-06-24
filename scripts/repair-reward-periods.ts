import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getNormalizedMonthRange(source: Date) {
  const year = source.getUTCFullYear();
  const monthIndex = source.getUTCMonth();

  return {
    periodStart: new Date(Date.UTC(year, monthIndex, 1)),
    periodEnd: new Date(Date.UTC(year, monthIndex + 1, 0))
  };
}

async function main() {
  const items = await prisma.rewardPunishment.findMany({
    orderBy: [{ periodStart: "asc" }, { createdAt: "asc" }]
  });

  let repairedCount = 0;

  for (const item of items) {
    const periodStartDay = item.periodStart.getUTCDate();
    const expectedEnd = new Date(
      Date.UTC(
        item.periodEnd.getUTCFullYear(),
        item.periodEnd.getUTCMonth() + 1,
        0
      )
    ).getUTCDate();
    const periodEndDay = item.periodEnd.getUTCDate();

    if (periodStartDay === 1 && periodEndDay === expectedEnd) {
      continue;
    }

    const anchor = new Date(
      Date.UTC(
        item.periodStart.getUTCFullYear(),
        item.periodStart.getUTCMonth(),
        item.periodStart.getUTCDate() + 1
      )
    );
    const normalized = getNormalizedMonthRange(anchor);

    await prisma.rewardPunishment.update({
      where: {
        id: item.id
      },
      data: normalized
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
            ? "Periode reward/punishment yang bergeser berhasil dinormalisasi."
            : "Tidak ada periode reward/punishment yang perlu diperbaiki."
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

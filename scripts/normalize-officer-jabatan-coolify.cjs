const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

const replacements = [
  {
    from: "Statistisi ahli pertama",
    to: "Statistisi Ahli Pertama"
  },
  {
    from: "Statistisi ahli muda",
    to: "Statistisi Ahli Muda"
  },
  {
    from: "Statistisi Ahli pertama",
    to: "Statistisi Ahli Pertama"
  },
  {
    from: "Statistisi Ahli muda",
    to: "Statistisi Ahli Muda"
  }
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL belum tersedia di environment Coolify.");
  }

  const before = await prisma.officer.groupBy({
    by: ["jabatan"],
    _count: { _all: true },
    orderBy: { jabatan: "asc" }
  });

  let updated = 0;

  if (!dryRun) {
    for (const replacement of replacements) {
      const result = await prisma.officer.updateMany({
        where: { jabatan: replacement.from },
        data: { jabatan: replacement.to }
      });

      updated += result.count;
    }
  } else {
    updated = before
      .filter((item) =>
        replacements.some((replacement) => replacement.from === item.jabatan)
      )
      .reduce((total, item) => total + item._count._all, 0);
  }

  const after = await prisma.officer.groupBy({
    by: ["jabatan"],
    _count: { _all: true },
    orderBy: { jabatan: "asc" }
  });

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "write",
        wouldOrDidUpdate: updated,
        before: before.map((item) => ({
          jabatan: item.jabatan ?? "Belum ditentukan",
          count: item._count._all
        })),
        after: after.map((item) => ({
          jabatan: item.jabatan ?? "Belum ditentukan",
          count: item._count._all
        }))
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

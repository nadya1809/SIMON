const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL belum tersedia di environment Coolify.");
  }

  const criteria = await prisma.criteria.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      sortOrder: true,
      isActive: true
    }
  });

  console.table(
    criteria.map((item) => ({
      id: item.id,
      nama: item.name,
      catatan: item.description ?? "-",
      urutan: item.sortOrder,
      aktif: item.isActive
    }))
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

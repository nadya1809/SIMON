import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const unitName = process.env.BOOTSTRAP_DEFAULT_UNIT_NAME || "Frontline 1";
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || "Admin SIMON";
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@simon.local";
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || "ChangeMe123!";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingUnit = await prisma.unit.findFirst({
    where: { name: unitName }
  });

  if (!existingUnit) {
    await prisma.unit.create({
      data: {
        name: unitName,
        description: "Unit default untuk inisialisasi aplikasi SIMON PST."
      }
    });
  }

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

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
      isActive: true
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      isActive: true
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

const { PrismaClient } = require("@prisma/client");

const officers = [
  {
    nip: "198405082007012004",
    name: "Mellisa Ayuningtyas, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "198605092009022009",
    name: "Hera Maitilova Jonar, SST, M.CIO",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "198802282010122005",
    name: "Angi Yefita Febria, SST, M.E",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "198311022007011007",
    name: "Sconda Novriadi, SST, M.E.",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "198410152007011003",
    name: "Rory, SST, M.Si",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199102112014121001",
    name: "Veri Wardi, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "198612152009122006",
    name: "Rika Elsa Manora, S.ST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "197710022003122003",
    name: "Okta Lolyanna, SE",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "198809142010122005",
    name: "Rizka Aulia, SST, M.S.E, M.Ec",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199404072018021001",
    name: "Yanda Frimahatta, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199403292017012001",
    name: "Dina Refanda, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199307262017012001",
    name: "Retno Lis Megawati, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199407272017012003",
    name: "Yuliana Livi Andam Putri, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199408222017011001",
    name: "Muhammad Arief Eko Pratama, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199103052014101003",
    name: "Muhamad Kanzu Satrio, SST, M.E",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199106092014122001",
    name: "Mimi Fadwa Kurniati, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199405222018022001",
    name: "Dila Silvia, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199202012014121001",
    name: "Hamdi Rafiqi, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Frontline 1"
  },
  {
    nip: "199710282019122002",
    name: "Ghina Mobareka, S.Tr.Stat.",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "198608232005022001",
    name: "Lora Anggraini, SE",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199001082019031001",
    name: "Dendy Nefrialdi, S.Si.",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199602112019032001",
    name: "Monica Putri Nelvenia, S.Stat.",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199110132019031001",
    name: "Octa Alfindo, S.Stat.",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199509242018022003",
    name: "Rahmi Septia Putri, SST",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199709032019122001",
    name: "Aneesha Kharisma Daryodi, S.Tr.Stat.",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199404242017011001",
    name: "Luthfan Eka Putra, SST",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199702132019122002",
    name: "Rovy Atuddarojah Syafitri, S.Tr.Stat.",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "198409262005021002",
    name: "Yudi Dharma, S.Tr.Stat",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199902252022011003",
    name: "Naufal Aqil Fadhlurrahman, S.Tr.Stat",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199808312021042001",
    name: "Nada Asria Farazilah, S.Tr.Stat.",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199907032023021002",
    name: "Hafizur Rahman, S.Tr.Stat",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199507102019032001",
    name: "Hayatul Khairani, S.Stat",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199512062018022001",
    name: "Nadya El Khair, SST",
    jabatan: "Statistisi ahli pertama",
    unit: "Frontline 2"
  },
  {
    nip: "199610172019012001",
    name: "Indriane Analisa, S.Tr.Stat.",
    jabatan: "Statistisi ahli pertama",
    unit: "Petugas Online"
  },
  {
    nip: "199210282019032001",
    name: "Hazna Hidayah, S.Si",
    jabatan: "Statistisi ahli pertama",
    unit: "Petugas Online"
  },
  {
    nip: "198010282009022004",
    name: "Sumi Lestari, SST",
    jabatan: "Statistisi ahli muda",
    unit: "Petugas Online"
  }
];

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");
const deactivateMissing = process.argv.includes("--deactivate-missing");

async function getOrCreateUnitId(name) {
  const existing = await prisma.unit.findFirst({
    where: { name },
    select: { id: true }
  });

  if (existing) {
    return existing.id;
  }

  if (dryRun) {
    return null;
  }

  const unit = await prisma.unit.create({
    data: { name },
    select: { id: true }
  });

  return unit.id;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL belum tersedia di environment Coolify.");
  }

  let created = 0;
  let updated = 0;
  const unitIds = new Map();

  for (const unitName of new Set(officers.map((officer) => officer.unit))) {
    unitIds.set(unitName, await getOrCreateUnitId(unitName));
  }

  for (const officer of officers) {
    const unitId = unitIds.get(officer.unit) ?? null;
    const existing = await prisma.officer.findUnique({
      where: { nip: officer.nip },
      select: { id: true }
    });

    if (dryRun) {
      if (existing) {
        updated += 1;
      } else {
        created += 1;
      }
      continue;
    }

    if (existing) {
      await prisma.officer.update({
        where: { id: existing.id },
        data: {
          name: officer.name,
          jabatan: officer.jabatan,
          unitId,
          isActive: true
        }
      });
      updated += 1;
      continue;
    }

    await prisma.officer.create({
      data: {
        nip: officer.nip,
        name: officer.name,
        jabatan: officer.jabatan,
        unitId,
        isActive: true
      }
    });
    created += 1;
  }

  let deactivated = 0;

  if (deactivateMissing && !dryRun) {
    const result = await prisma.officer.updateMany({
      where: {
        nip: {
          notIn: officers.map((officer) => officer.nip)
        },
        isActive: true
      },
      data: { isActive: false }
    });
    deactivated = result.count;
  }

  const imported = await prisma.officer.findMany({
    where: {
      nip: {
        in: officers.map((officer) => officer.nip)
      }
    },
    select: {
      unit: {
        select: { name: true }
      }
    }
  });

  const importedByUnit = imported.reduce((accumulator, officer) => {
    const unitName = officer.unit?.name ?? "Tanpa unit";
    accumulator[unitName] = (accumulator[unitName] ?? 0) + 1;
    return accumulator;
  }, {});

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "write",
        totalSeedRows: officers.length,
        created,
        updated,
        deactivated,
        importedInDatabase: imported.length,
        importedByUnit,
        deactivateMissing
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

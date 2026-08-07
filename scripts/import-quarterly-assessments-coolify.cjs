const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const assessmentDate =
  readArg("--date") ?? process.env.ASSESSMENT_DATE ?? "2026-06-30";
const assessorEmail = readArg("--assessor-email") ?? process.env.ASSESSOR_EMAIL;
const dryRun = process.argv.includes("--dry-run");
const replaceExisting = process.argv.includes("--replace");
const createReward = process.argv.includes("--create-reward");

const periodStart = "2026-04-01";
const periodEnd = "2026-06-30";

const criteriaColumns = [
  ["Disiplin", "disiplin"],
  ["Kinerja", "kinerja"],
  ["Kerjasama", "kerjasama"],
  ["Inovatif", "inovatif"],
  ["Penilaian Pengguna Layanan", "pengguna"],
  ["Penampilan", "penampilan"]
];

const rows = [
  { name: "Mellisa Ayuningtyas, SST", disiplin: 96, kinerja: 97, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 97.5, disciplineNote: "1 tdk hadir di juni" },
  { name: "Hera Maitilova Jonar, SST, M.CIO", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Angi Yefita Febria, SST, M.E", disiplin: 96, kinerja: 96, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 97.33, disciplineNote: "1 tidak hadir di mei" },
  { name: "Sconda Novriadi, SST, M.E.", disiplin: 95, kinerja: 96, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 97.17, disciplineNote: "1 tidak hadir di mei" },
  { name: "Rory, SST, M.Si", disiplin: 98, kinerja: 98.1, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98.02 },
  { name: "Veri Wardi, SST", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Rika Elsa Manora, S.ST", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Okta Lolyanna, SE", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Rizka Aulia, SST, M.S.E, M.Ec", disiplin: 96, kinerja: 97, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 97.5, disciplineNote: "1 tdk hadir di juni" },
  { name: "Yanda Frimahatta, SST", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Dina Refanda, SST", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Retno Lis Megawati, SST", disiplin: 98, kinerja: 98.5, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98.08, ranking: 2 },
  { name: "Yuliana Livi Andam Putri, SST", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Muhammad Arief Eko Pratama, SST", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Muhamad Kanzu Satrio, SST, M.E", disiplin: 96, kinerja: 98.2, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 97.7, disciplineNote: "1 tdk hadir diJuni" },
  { name: "Mimi Fadwa Kurniati, SST", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Dila Silvia, SST", disiplin: 97, kinerja: 97, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 97.67 },
  { name: "Hamdi Rafiqi, SST", disiplin: 97, kinerja: 97, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 97.67 },
  { name: "Ghina Mobareka, S.Tr.Stat.", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Lora Anggraini, SE", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Dendy Nefrialdi, S.Si.", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Monica Putri Nelvenia, S.Stat.", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Octa Alfindo, S.Stat.", disiplin: 98, kinerja: 98.2, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98.03 },
  { name: "Rahmi Septia Putri, SST", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Aneesha Kharisma Daryodi, S.Tr.Stat.", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98, sbe: "SBE Apr 17, Mei 17, Juni 5, total 39" },
  { name: "Luthfan Eka Putra, SST", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Rovy Atuddarojah Syafitri, S.Tr.Stat.", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Yudi Dharma, S.Tr.Stat", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Naufal Aqil Fadhlurrahman, S.Tr.Stat", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Nada Asria Farazilah, S.Tr.Stat.", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Hafizur Rahman, S.Tr.Stat", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Hayatul Khairani, S.Stat", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98 },
  { name: "Nadya El Khair, SST", disiplin: 98, kinerja: 98.3, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98.05, ranking: 3 },
  { name: "Indriane Analisa, S.Tr.Stat.", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 98.3, pengguna: 98, penampilan: 98, komplain: 0, average: 98.05, ranking: 3 },
  { name: "Hazna Hidayah, S.Si", disiplin: 98, kinerja: 98, kerjasama: 98, inovatif: 99, pengguna: 98, penampilan: 98, komplain: 0, average: 98.17, ranking: 1, keterangan: "Diajukan mendapatkan penghargaan", sbe: "SBE Apr 27, Mei 6, Juni 6, total 39" },
  { name: "Sumi Lestari, SST", disiplin: 98, kinerja: 98.5, kerjasama: 98, inovatif: 98, pengguna: 98, penampilan: 98, komplain: 0, average: 98.08, ranking: 2, sbe: "SBE Apr 11, Mei 14, Juni 15, total 40" }
];

function readArg(name) {
  const prefix = `${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : undefined;
}

function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Tanggal tidak valid: ${value}. Gunakan format YYYY-MM-DD.`);
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function buildNotes(row) {
  const parts = [
    "Import Excel Triwulan II 2026",
    `Jumlah komplain: ${row.komplain}`
  ];

  if (row.ranking) {
    parts.push(`Ranking: ${row.ranking}`);
  }

  if (row.keterangan) {
    parts.push(row.keterangan);
  }

  if (row.disciplineNote) {
    parts.push(`Disiplin: ${row.disciplineNote}`);
  }

  if (row.sbe) {
    parts.push(row.sbe);
  }

  return parts.join(" | ").slice(0, 255);
}

async function resolveAssessor() {
  if (assessorEmail) {
    const user = await prisma.user.findUnique({
      where: { email: assessorEmail },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new Error(`Assessor aktif dengan email ${assessorEmail} tidak ditemukan.`);
    }

    return user;
  }

  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      role: { in: ["ADMIN", "SUPERVISOR"] }
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, email: true, name: true, role: true, isActive: true }
  });

  if (!user) {
    throw new Error("Tidak ada ADMIN/SUPERVISOR aktif untuk assessor import.");
  }

  return user;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL belum tersedia di environment Coolify.");
  }

  const date = parseDateOnly(assessmentDate);
  const assessor = await resolveAssessor();
  const officers = await prisma.officer.findMany({
    select: { id: true, name: true, nip: true }
  });
  const officerMap = new Map(
    officers.map((officer) => [normalizeName(officer.name), officer])
  );
  const criteria = await prisma.criteria.findMany({
    where: {
      name: { in: criteriaColumns.map(([name]) => name) }
    },
    select: { id: true, name: true }
  });
  const criteriaMap = new Map(criteria.map((item) => [item.name, item.id]));
  const missingCriteria = criteriaColumns
    .map(([name]) => name)
    .filter((name) => !criteriaMap.has(name));

  if (missingCriteria.length) {
    throw new Error(`Kriteria belum ada di database: ${missingCriteria.join(", ")}`);
  }

  const unmatched = rows
    .filter((row) => !officerMap.has(normalizeName(row.name)))
    .map((row) => row.name);

  if (unmatched.length) {
    throw new Error(`Pegawai dari Excel belum cocok di database: ${unmatched.join(", ")}`);
  }

  let created = 0;
  let updated = 0;
  let skippedExisting = 0;
  let rewardCreated = 0;
  let rewardSkipped = 0;

  for (const row of rows) {
    const officer = officerMap.get(normalizeName(row.name));
    const scores = criteriaColumns.map(([criteriaName, key]) => ({
      criteriaId: criteriaMap.get(criteriaName),
      score: row[key]
    }));
    const existing = await prisma.dailyAssessment.findUnique({
      where: {
        officerId_assessmentDate: {
          officerId: officer.id,
          assessmentDate: date
        }
      },
      select: { id: true }
    });

    if (dryRun) {
      if (existing) {
        skippedExisting += 1;
      } else {
        created += 1;
      }
      continue;
    }

    if (existing && !replaceExisting) {
      skippedExisting += 1;
      continue;
    }

    if (existing && replaceExisting) {
      await prisma.dailyAssessment.update({
        where: { id: existing.id },
        data: {
          assessorId: assessor.id,
          status: "PRESENT",
          averageScore: row.average,
          notes: buildNotes(row),
          scores: {
            deleteMany: {},
            create: scores
          }
        }
      });
      updated += 1;
    } else {
      await prisma.dailyAssessment.create({
        data: {
          officerId: officer.id,
          assessorId: assessor.id,
          assessmentDate: date,
          status: "PRESENT",
          averageScore: row.average,
          notes: buildNotes(row),
          scores: {
            create: scores
          }
        }
      });
      created += 1;
    }

    if (createReward && row.keterangan) {
      const existingReward = await prisma.rewardPunishment.findFirst({
        where: {
          officerId: officer.id,
          type: "REWARD",
          periodKind: "QUARTERLY",
          periodStart: parseDateOnly(periodStart),
          periodEnd: parseDateOnly(periodEnd),
          category: row.keterangan
        },
        select: { id: true }
      });

      if (existingReward) {
        rewardSkipped += 1;
      } else {
        await prisma.rewardPunishment.create({
          data: {
            officerId: officer.id,
            type: "REWARD",
            periodKind: "QUARTERLY",
            referenceDate: date,
            category: row.keterangan,
            periodStart: parseDateOnly(periodStart),
            periodEnd: parseDateOnly(periodEnd),
            triggerScore: row.average,
            status: "RECOMMENDED",
            notes: `Import Excel Triwulan II 2026 | Ranking: ${row.ranking ?? "-"}`
          }
        });
        rewardCreated += 1;
      }
    }
  }

  const importedCount = await prisma.dailyAssessment.count({
    where: {
      assessmentDate: date,
      officerId: {
        in: rows.map((row) => officerMap.get(normalizeName(row.name)).id)
      }
    }
  });

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "write",
        assessmentDate,
        periodStart,
        periodEnd,
        assessor: {
          email: assessor.email,
          name: assessor.name,
          role: assessor.role
        },
        sourceRows: rows.length,
        scoreCriteriaImported: criteriaColumns.map(([name]) => name),
        complaintHandling: "Jumlah Komplain disimpan di notes, bukan skor, karena nilainya adalah jumlah 0+ sedangkan skor aplikasi 1-100.",
        created,
        updated,
        skippedExisting,
        importedCount,
        replaceExisting,
        createReward,
        rewardCreated,
        rewardSkipped
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

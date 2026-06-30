import path from "node:path";
import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeCell(value: ExcelJS.CellValue | undefined | null) {
  if (value == null) {
    return "";
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }

    if ("result" in value && value.result != null) {
      return String(value.result).trim();
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((item) => item.text).join("").trim();
    }
  }

  return String(value).trim();
}

function normalizeNip(raw: string) {
  if (!raw) {
    return "";
  }

  const compact = raw.replace(/\s+/g, "");

  if (/e\+/i.test(compact)) {
    const numeric = Number(compact);

    if (Number.isFinite(numeric)) {
      return numeric.toLocaleString("en-US", {
        useGrouping: false,
        maximumFractionDigits: 0
      });
    }
  }

  return compact;
}

async function main() {
  const filePath =
    process.argv[2] ??
    "C:\\Users\\Asus\\Downloads\\JADWAL PIKET PST BPS PROVINSI SUMATERA BARAT 2026 (1).xlsx";
  const resolvedPath = path.resolve(filePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(resolvedPath);

  const worksheet = workbook.getWorksheet("Pegawai");

  if (!worksheet) {
    throw new Error("Sheet 'Pegawai' tidak ditemukan.");
  }

  const units = await prisma.unit.findMany();
  const unitMap = new Map(units.map((unit) => [unit.name.trim(), unit.id]));

  const rowsToImport: Array<{
    nip: string;
    name: string;
    pejabat: string | null;
    unitId: string | null;
  }> = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) {
      return;
    }

    const no = normalizeCell(row.getCell(1).value);
    const name = normalizeCell(row.getCell(2).value);
    const pejabat = normalizeCell(row.getCell(4).value);
    const rawNip = normalizeCell(row.getCell(5).value);
    const unitName = normalizeCell(row.getCell(6).value);

    if (!no || !name || !rawNip) {
      return;
    }

    if (!/^\d+$/.test(no)) {
      return;
    }

    rowsToImport.push({
      nip: normalizeNip(rawNip),
      name,
      pejabat: pejabat || null,
      unitId: unitMap.get(unitName) ?? null
    });
  });

  let created = 0;
  let updated = 0;

  for (const item of rowsToImport) {
    const existing = await prisma.officer.findUnique({
      where: { nip: item.nip }
    });

    if (existing) {
      await prisma.officer.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          pejabat: item.pejabat,
          unitId: item.unitId,
          isActive: true
        }
      });
      updated += 1;
      continue;
    }

    await prisma.officer.create({
      data: {
        nip: item.nip,
        name: item.name,
        pejabat: item.pejabat,
        unitId: item.unitId,
        isActive: true
      }
    });
    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        filePath: resolvedPath,
        totalRows: rowsToImport.length,
        created,
        updated
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

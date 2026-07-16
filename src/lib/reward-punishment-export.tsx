import ExcelJS from "exceljs";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer
} from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import {
  buildRewardPunishmentWhere,
  formatRecommendationPeriodLabel
} from "@/lib/reward-punishment";
import { formatAverageScore } from "@/lib/scoring";

type RewardPunishmentExportParams = {
  search?: string;
  officerId?: string;
  unitId?: string;
  status?: string;
  type?: string;
  from?: string;
  to?: string;
};

const rewardPunishmentInclude = {
  officer: {
    include: {
      unit: true
    }
  }
} as const;

function buildRecommendationTypeLabel(type: "EVALUASI" | "REWARD" | "PUNISHMENT") {
  if (type === "EVALUASI") {
    return "Evaluasi";
  }

  if (type === "REWARD") {
    return "Reward";
  }

  return "Punishment";
}

function buildRecommendationStatusLabel(
  status: "RECOMMENDED" | "APPROVED" | "REJECTED"
) {
  if (status === "APPROVED") {
    return "Disetujui";
  }

  if (status === "REJECTED") {
    return "Ditolak";
  }

  return "Menunggu keputusan";
}

async function getRewardPunishmentExportData(params: RewardPunishmentExportParams) {
  const filters = {
    search: params.search?.trim() || "",
    officerId: params.officerId?.trim() || "",
    unitId: params.unitId?.trim() || "",
    status: params.status?.trim() || "",
    type: params.type?.trim() || "",
    from: params.from?.trim() || "",
    to: params.to?.trim() || ""
  };
  const where = buildRewardPunishmentWhere(filters);

  const [recommendations, officers, units] = await Promise.all([
    prisma.rewardPunishment.findMany({
      where,
      include: rewardPunishmentInclude,
      orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }]
    }),
    prisma.officer.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        nip: true,
        unit: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.unit.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true
      }
    })
  ]);

  return {
    filters,
    officers: officers.map((officer) => ({
      id: officer.id,
      name: officer.name,
      nip: officer.nip,
      unitName: officer.unit?.name ?? "Belum ditentukan"
    })),
    units,
    summary: {
      total: recommendations.length,
      RECOMMENDED: recommendations.filter((item) => item.status === "RECOMMENDED")
        .length,
      APPROVED: recommendations.filter((item) => item.status === "APPROVED")
        .length,
      REJECTED: recommendations.filter((item) => item.status === "REJECTED").length
    },
    rows: recommendations.map((recommendation) => ({
      id: recommendation.id,
      period: formatRecommendationPeriodLabel({
        periodKind: recommendation.periodKind,
        periodStart: recommendation.periodStart,
        periodEnd: recommendation.periodEnd
      }),
      officerName: recommendation.officer.name,
      officerNip: recommendation.officer.nip,
      unitName: recommendation.officer.unit?.name ?? "Belum ditentukan",
      typeLabel: buildRecommendationTypeLabel(recommendation.type),
      scoreLabel: formatAverageScore(recommendation.triggerScore),
      category: recommendation.category,
      statusLabel: buildRecommendationStatusLabel(recommendation.status)
    }))
  };
}

export function buildRewardPunishmentExportBaseName(params: {
  from?: string;
  to?: string;
}) {
  return `laporan-evaluasi-reward-punishment-${params.from || "default"}-sampai-${params.to || "default"}`;
}

export async function buildRewardPunishmentExcelBuffer(
  params: RewardPunishmentExportParams
) {
  const data = await getRewardPunishmentExportData(params);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Laporan ERP");

  sheet.columns = [
    { header: "Periode", key: "period", width: 30 },
    { header: "Petugas", key: "officerName", width: 28 },
    { header: "NIP", key: "officerNip", width: 22 },
    { header: "Unit", key: "unitName", width: 20 },
    { header: "Tipe", key: "typeLabel", width: 16 },
    { header: "Skor", key: "scoreLabel", width: 12 },
    { header: "Kategori", key: "category", width: 24 },
    { header: "Status", key: "statusLabel", width: 22 }
  ];

  const infoRows = [
    ["Laporan Evaluasi, Reward, dan Punishment"],
    [`Periode filter: ${data.filters.from || "-"} sampai ${data.filters.to || "-"}`],
    [`Unit filter: ${data.units.find((unit) => unit.id === data.filters.unitId)?.name ?? "Semua unit"}`],
    [`Petugas filter: ${data.officers.find((officer) => officer.id === data.filters.officerId)?.name ?? "Semua petugas"}`],
    [`Pencarian: ${data.filters.search || "-"} | Tipe: ${data.filters.type || "Semua"} | Status: ${data.filters.status || "Semua"}`],
    [`Total data: ${data.summary.total} | Menunggu: ${data.summary.RECOMMENDED} | Disetujui: ${data.summary.APPROVED} | Ditolak: ${data.summary.REJECTED}`]
  ];

  infoRows.forEach((value, index) => {
    const row = sheet.addRow(value);
    sheet.mergeCells(row.number, 1, row.number, 8);
    const cell = sheet.getCell(row.number, 1);
    cell.font = {
      bold: true,
      size: index === 0 ? 14 : 11,
      italic: index > 0
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: index === 0 ? "D9EEF9" : "F7FBFD" }
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });

  sheet.addRow([]);
  const headerRow = sheet.addRow([
    "Periode",
    "Petugas",
    "NIP",
    "Unit",
    "Tipe",
    "Skor",
    "Kategori",
    "Status"
  ]);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E9F3EA" }
  };

  data.rows.forEach((row) => {
    sheet.addRow(row);
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const pdfStyles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    color: "#1f2937"
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4
  },
  description: {
    marginBottom: 10,
    color: "#4b5563"
  },
  section: {
    marginBottom: 14
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 4
  },
  headerRow: {
    backgroundColor: "#f3f4f6",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb"
  },
  cellPeriod: {
    width: "22%"
  },
  cellOfficer: {
    width: "20%"
  },
  cellNip: {
    width: "14%"
  },
  cellUnit: {
    width: "12%"
  },
  cellType: {
    width: "9%"
  },
  cellScore: {
    width: "8%"
  },
  cellCategory: {
    width: "15%"
  },
  muted: {
    color: "#6b7280"
  }
});

export async function buildRewardPunishmentPdfBuffer(
  params: RewardPunishmentExportParams
) {
  const data = await getRewardPunishmentExportData(params);

  const document = (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Laporan Evaluasi, Reward, dan Punishment</Text>
        <Text style={pdfStyles.description}>
          Periode {data.filters.from || "-"} sampai {data.filters.to || "-"}
        </Text>
        <Text style={pdfStyles.description}>
          Petugas{" "}
          {data.officers.find((officer) => officer.id === data.filters.officerId)
            ?.name ?? "Semua petugas"}{" "}
          | Unit{" "}
          {data.units.find((unit) => unit.id === data.filters.unitId)?.name ??
            "Semua unit"}
        </Text>
        <Text style={pdfStyles.description}>
          Pencarian {data.filters.search || "-"} | Tipe{" "}
          {data.filters.type || "Semua"} | Status {data.filters.status || "Semua"}
        </Text>

        <View style={pdfStyles.section}>
          <View style={[pdfStyles.row, pdfStyles.headerRow]}>
            <Text style={pdfStyles.cellPeriod}>Periode</Text>
            <Text style={pdfStyles.cellOfficer}>Petugas</Text>
            <Text style={pdfStyles.cellNip}>NIP</Text>
            <Text style={pdfStyles.cellUnit}>Unit</Text>
            <Text style={pdfStyles.cellType}>Tipe</Text>
            <Text style={pdfStyles.cellScore}>Skor</Text>
            <Text style={pdfStyles.cellCategory}>Kategori | Status</Text>
          </View>
          {data.rows.map((row) => (
            <View key={row.id} style={pdfStyles.row}>
              <Text style={pdfStyles.cellPeriod}>{row.period}</Text>
              <Text style={pdfStyles.cellOfficer}>{row.officerName}</Text>
              <Text style={pdfStyles.cellNip}>{row.officerNip}</Text>
              <Text style={pdfStyles.cellUnit}>{row.unitName}</Text>
              <Text style={pdfStyles.cellType}>{row.typeLabel}</Text>
              <Text style={pdfStyles.cellScore}>{row.scoreLabel}</Text>
              <Text style={pdfStyles.cellCategory}>
                {row.category} | {row.statusLabel}
              </Text>
            </View>
          ))}
          {!data.rows.length ? (
            <Text style={pdfStyles.muted}>
              Tidak ada data evaluasi, reward, atau punishment untuk filter ini.
            </Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );

  return Buffer.from(await renderToBuffer(document));
}

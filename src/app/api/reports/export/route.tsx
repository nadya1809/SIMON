import ExcelJS from "exceljs";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-guard";
import { getReportData } from "@/lib/reports";
import { reportExportSchema } from "@/lib/validations/report";
import { formatAverageScore } from "@/lib/scoring";

function toDateLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(value);
}

function buildFileBaseName(from: string, to: string) {
  return `laporan-simon-${from}-sampai-${to}`;
}

async function buildExcelBuffer(params: {
  from: string;
  to: string;
  unitId?: string;
}) {
  const report = await getReportData(params);
  const workbook = new ExcelJS.Workbook();
  const detailSheet = workbook.addWorksheet("Laporan");
  const rankingSheet = workbook.addWorksheet("Ranking");
  const criteriaHeaders = report.criteria.map((item) => item.name);

  detailSheet.columns = [
    { header: "Tanggal", key: "assessmentDate", width: 16 },
    { header: "Petugas", key: "officerName", width: 28 },
    { header: "NIP", key: "officerNip", width: 18 },
    { header: "Unit", key: "unitName", width: 24 },
    { header: "Status", key: "status", width: 14 },
    ...criteriaHeaders.map((header, index) => ({
      header,
      key: `criteria_${index}`,
      width: 14
    })),
    { header: "Rata-rata", key: "averageScore", width: 14 }
  ];

  detailSheet.getRow(1).font = { bold: true };
  detailSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E9F3EA" }
  };

  report.rows.forEach((row) => {
    detailSheet.addRow({
      assessmentDate: toDateLabel(row.assessmentDate),
      officerName: row.officerName,
      officerNip: row.officerNip,
      unitName: row.unitName,
      status: row.status === "PRESENT" ? "Hadir" : "Tidak Hadir",
      ...Object.fromEntries(
        row.criteriaScores.map((score, index) => [`criteria_${index}`, score.score ?? "-"])
      ),
      averageScore: formatAverageScore(row.averageScore)
    });
  });

  rankingSheet.columns = [
    { header: "Peringkat", key: "rank", width: 12 },
    { header: "Petugas", key: "officerName", width: 28 },
    { header: "NIP", key: "officerNip", width: 18 },
    { header: "Unit", key: "unitName", width: 24 },
    { header: "Rata-rata", key: "averageScore", width: 14 },
    { header: "Jumlah Penilaian", key: "totalAssessments", width: 18 }
  ];

  rankingSheet.getRow(1).font = { bold: true };
  rankingSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "F9E7D8" }
  };

  report.ranking.forEach((item) => {
    rankingSheet.addRow({
      rank: item.rank,
      officerName: item.officerName,
      officerNip: item.officerNip,
      unitName: item.unitName,
      averageScore: item.averageScore.toFixed(2),
      totalAssessments: item.totalAssessments
    });
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
    marginBottom: 12,
    color: "#4b5563"
  },
  section: {
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6
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
  cellSm: {
    width: "10%"
  },
  cellMd: {
    width: "16%"
  },
  cellLg: {
    width: "24%"
  },
  cellXl: {
    width: "30%"
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  summaryCard: {
    width: "48%",
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 6
  },
  muted: {
    color: "#6b7280"
  }
});

async function buildPdfBuffer(params: {
  from: string;
  to: string;
  unitId?: string;
}) {
  const report = await getReportData(params);

  const document = (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Laporan SIMON PST</Text>
        <Text style={pdfStyles.description}>
          Periode {report.filters.from} sampai {report.filters.to}
        </Text>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Ringkasan</Text>
          <View style={pdfStyles.summaryGrid}>
            <View style={pdfStyles.summaryCard}>
              <Text>Total penilaian</Text>
              <Text>{report.summary.totalAssessments}</Text>
            </View>
            <View style={pdfStyles.summaryCard}>
              <Text>Petugas tercakup</Text>
              <Text>{report.summary.totalOfficers}</Text>
            </View>
            <View style={pdfStyles.summaryCard}>
              <Text>Hadir</Text>
              <Text>{report.summary.totalPresent}</Text>
            </View>
            <View style={pdfStyles.summaryCard}>
              <Text>Rata-rata</Text>
              <Text>{report.summary.overallAverage.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Ranking petugas</Text>
          <View style={[pdfStyles.row, pdfStyles.headerRow]}>
            <Text style={pdfStyles.cellSm}>Rank</Text>
            <Text style={pdfStyles.cellLg}>Petugas</Text>
            <Text style={pdfStyles.cellLg}>Unit</Text>
            <Text style={pdfStyles.cellMd}>Rata-rata</Text>
            <Text style={pdfStyles.cellMd}>Jumlah</Text>
          </View>
          {report.ranking.slice(0, 10).map((item) => (
            <View key={item.officerId} style={pdfStyles.row}>
              <Text style={pdfStyles.cellSm}>#{item.rank}</Text>
              <Text style={pdfStyles.cellLg}>{item.officerName}</Text>
              <Text style={pdfStyles.cellLg}>{item.unitName}</Text>
              <Text style={pdfStyles.cellMd}>{item.averageScore.toFixed(2)}</Text>
              <Text style={pdfStyles.cellMd}>{item.totalAssessments}</Text>
            </View>
          ))}
          {!report.ranking.length ? (
            <Text style={pdfStyles.muted}>
              Belum ada ranking pada periode ini.
            </Text>
          ) : null}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Detail penilaian</Text>
          <View style={[pdfStyles.row, pdfStyles.headerRow]}>
            <Text style={pdfStyles.cellMd}>Tanggal</Text>
            <Text style={pdfStyles.cellXl}>Petugas</Text>
            <Text style={pdfStyles.cellLg}>Status</Text>
            <Text style={pdfStyles.cellMd}>Rata-rata</Text>
          </View>
          {report.rows.slice(0, 20).map((row) => (
            <View key={row.id} style={pdfStyles.row}>
              <Text style={pdfStyles.cellMd}>{toDateLabel(row.assessmentDate)}</Text>
              <Text style={pdfStyles.cellXl}>{row.officerName}</Text>
              <Text style={pdfStyles.cellLg}>
                {row.status === "PRESENT" ? "Hadir" : "Tidak Hadir"}
              </Text>
              <Text style={pdfStyles.cellMd}>
                {formatAverageScore(row.averageScore)}
              </Text>
            </View>
          ))}
          {report.rows.length > 20 ? (
            <Text style={pdfStyles.muted}>
              Ringkasan PDF dibatasi 20 baris detail pertama agar tetap ringkas.
            </Text>
          ) : null}
          {!report.rows.length ? (
            <Text style={pdfStyles.muted}>
              Tidak ada data penilaian pada periode ini.
            </Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );

  return Buffer.from(await renderToBuffer(document));
}

export async function GET(request: Request) {
  const { response } = await requireApiAuth();

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const parsed = reportExportSchema.safeParse({
    format: searchParams.get("format")?.trim(),
    from: searchParams.get("from")?.trim() || "",
    to: searchParams.get("to")?.trim() || "",
    unitId: searchParams.get("unitId")?.trim() || ""
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Parameter export tidak valid.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const { format, from, to, unitId } = parsed.data;
  const resolvedFrom = from || "";
  const resolvedTo = to || "";
  const fileBaseName = buildFileBaseName(
    resolvedFrom || "default",
    resolvedTo || "default"
  );
  const buffer =
    format === "xlsx"
      ? await buildExcelBuffer({ from: resolvedFrom, to: resolvedTo, unitId })
      : await buildPdfBuffer({ from: resolvedFrom, to: resolvedTo, unitId });
  const contentType =
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf";
  const extension = format === "xlsx" ? "xlsx" : "pdf";

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileBaseName}.${extension}"`,
      "Content-Length": String(buffer.byteLength)
    }
  });
}

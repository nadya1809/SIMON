import ExcelJS from "exceljs";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer
} from "@react-pdf/renderer";
import {
  buildCriteriaAverages,
  buildGroupedReport,
  getReportData,
  type ReportRow
} from "@/lib/reports";
import { formatAverageScore } from "@/lib/scoring";

function toDateLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(value);
}

function toCriteriaSummary(row: ReportRow) {
  if (row.status !== "PRESENT") {
    return "Skor kriteria: tidak ada karena status tidak hadir.";
  }

  const criteriaSummary = row.criteriaScores
    .map(
      (score) => `${score.criteriaName}: ${score.score === null ? "-" : score.score}`
    )
    .join(" | ");

  return `Skor kriteria: ${criteriaSummary || "-"}`;
}

function toCriteriaAverageSummary(
  rows: ReportRow[],
  criteria: Awaited<ReturnType<typeof getReportData>>["criteria"]
) {
  return buildCriteriaAverages(rows, criteria)
    .map(
      (item) =>
        `${item.criteriaName}: ${formatAverageScore(item.averageScore)}`
    )
    .join(" | ");
}

export function buildReportFileBaseName(from: string, to: string) {
  return `laporan-simon-${from}-sampai-${to}`;
}

export async function buildExcelReportBuffer(params: {
  search?: string;
  from: string;
  to: string;
  unitId?: string;
  officerId?: string;
}) {
  const report = await getReportData({
    ...params,
    includeAllRows: true
  });
  const groupedReport = buildGroupedReport(report.rows);
  const workbook = new ExcelJS.Workbook();
  const detailSheet = workbook.addWorksheet("Laporan");
  const rankingSheet = workbook.addWorksheet("Ranking");
  const criteriaHeaders = report.criteria.map((item) => item.name);

  const detailColumns = [
    { header: "Tanggal", key: "assessmentDate", width: 16 },
    { header: "Status", key: "status", width: 14 },
    ...criteriaHeaders.map((header, index) => ({
      header,
      key: `criteria_${index}`,
      width: 14
    })),
    { header: "Rata-rata", key: "averageScore", width: 14 }
  ];
  const detailColumnCount = detailColumns.length;

  detailSheet.columns = detailColumns;

  function mergeAcrossColumns(rowNumber: number) {
    detailSheet.mergeCells(rowNumber, 1, rowNumber, detailColumnCount);
  }

  function styleMergedLabelRow(
    rowNumber: number,
    options: {
      fill: string;
      fontColor?: string;
      bold?: boolean;
      size?: number;
      italic?: boolean;
    }
  ) {
    const cell = detailSheet.getCell(rowNumber, 1);
    cell.font = {
      bold: options.bold ?? true,
      color: options.fontColor ? { argb: options.fontColor } : undefined,
      size: options.size,
      italic: options.italic
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: options.fill }
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "left"
    };
  }

  const infoRows = [
    ["Laporan Penilaian Kinerja SIMON PST"],
    [`Periode filter: ${report.filters.from || "-"} sampai ${report.filters.to || "-"}`],
    [`Unit filter: ${report.units.find((unit) => unit.id === report.filters.unitId)?.name ?? "Semua unit"}`],
    [`Petugas filter: ${report.officers.find((officer) => officer.id === report.filters.officerId)?.name ?? "Semua petugas"}`],
    [`Total penilaian: ${report.summary.totalAssessments} | Petugas tercakup: ${report.summary.totalOfficers} | Rata-rata keseluruhan: ${report.summary.overallAverage.toFixed(2)}`],
    [`Rata-rata per kriteria: ${report.criteriaAverages.map((item) => `${item.criteriaName} ${formatAverageScore(item.averageScore)}`).join(" | ")}`]
  ];

  infoRows.forEach((value) => {
    const row = detailSheet.addRow(value);
    mergeAcrossColumns(row.number);
    styleMergedLabelRow(row.number, {
      fill: row.number === 1 ? "D9EEF9" : "F7FBFD",
      fontColor: "17324D",
      bold: row.number !== 4 && row.number !== 6,
      size: row.number === 1 ? 14 : 11,
      italic: row.number === 4 || row.number === 6
    });
  });

  detailSheet.addRow([]);

  groupedReport.forEach((officer) => {
    const officerRow = detailSheet.addRow([
      `Petugas: ${officer.officerName} | NIP: ${officer.officerNip} | Unit: ${officer.unitName}`
    ]);
    mergeAcrossColumns(officerRow.number);
    styleMergedLabelRow(officerRow.number, {
      fill: "DBEAFE",
      fontColor: "1D4ED8",
      bold: true,
      size: 12
    });

    officer.years.forEach((year) => {
      const yearRow = detailSheet.addRow([
        `Tahun ${year.yearLabel} | Total tugas: ${year.totalTasks} | Rata-rata tahunan: ${formatAverageScore(year.averageScore)}`
      ]);
      mergeAcrossColumns(yearRow.number);
      styleMergedLabelRow(yearRow.number, {
        fill: "E0F2FE",
        fontColor: "075985",
        bold: true
      });

      year.months.forEach((month) => {
        const monthRow = detailSheet.addRow([
          `Periode ${month.monthLabel}`
        ]);
        mergeAcrossColumns(monthRow.number);
        styleMergedLabelRow(monthRow.number, {
          fill: "ECFDF5",
          fontColor: "065F46",
          bold: true
        });

        const headerRow = detailSheet.addRow(
          detailColumns.map((column) => column.header)
        );
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "E9F3EA" }
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };

        month.details.forEach((row) => {
          detailSheet.addRow({
            assessmentDate: toDateLabel(row.assessmentDate),
            status: row.status === "PRESENT" ? "Hadir" : "Tidak Hadir",
            ...Object.fromEntries(
              row.criteriaScores.map((score, index) => [
                `criteria_${index}`,
                score.score ?? "-"
              ])
            ),
            averageScore: formatAverageScore(row.averageScore)
          });
        });

        const criteriaAverageRow = detailSheet.addRow({
          assessmentDate: "Rata-rata kriteria",
          status: "",
          ...Object.fromEntries(
            buildCriteriaAverages(month.details, report.criteria).map(
              (item, index) => [
                `criteria_${index}`,
                formatAverageScore(item.averageScore)
              ]
            )
          ),
          averageScore: formatAverageScore(month.averageScore)
        });
        criteriaAverageRow.font = { bold: true, color: { argb: "0F172A" } };
        criteriaAverageRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "E0F2FE" }
        };

        const summaryRow = detailSheet.addRow([
          `Jumlah tugas: ${month.totalTasks} kali | Penilaian hadir: ${month.presentTaskCount} | Rata-rata nilai ${month.monthLabel}: ${formatAverageScore(month.averageScore)}`
        ]);
        mergeAcrossColumns(summaryRow.number);
        styleMergedLabelRow(summaryRow.number, {
          fill: "FEF3C7",
          fontColor: "92400E",
          bold: true
        });
      });

      if (year.months.length > 1) {
        const recapHeaderRow = detailSheet.addRow([
          `Rekap bulanan ${year.yearLabel}`
        ]);
        mergeAcrossColumns(recapHeaderRow.number);
        styleMergedLabelRow(recapHeaderRow.number, {
          fill: "F3E8FF",
          fontColor: "6B21A8",
          bold: true
        });

        const recapTableHeader = detailSheet.addRow([
          "Bulan",
          "Jumlah Tugas",
          "Penilaian Hadir",
          "Rata-rata Bulanan"
        ]);
        recapTableHeader.font = { bold: true };
        recapTableHeader.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F5F3FF" }
        };

        year.months.forEach((month) => {
          detailSheet.addRow([
            month.monthLabel,
            month.totalTasks,
            month.presentTaskCount,
            formatAverageScore(month.averageScore)
          ]);
        });

        const annualSummaryRow = detailSheet.addRow([
          `Rata-rata tahunan ${year.yearLabel}: ${formatAverageScore(year.averageScore)} | Total tugas: ${year.totalTasks} kali`
        ]);
        mergeAcrossColumns(annualSummaryRow.number);
        styleMergedLabelRow(annualSummaryRow.number, {
          fill: "FDE68A",
          fontColor: "78350F",
          bold: true
        });
      }
    });

    detailSheet.addRow([]);
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
  },
  assessmentBlock: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 4
  },
  assessmentSummary: {
    marginTop: 2,
    fontSize: 9,
    color: "#4b5563"
  }
});

export async function buildPdfReportBuffer(params: {
  search?: string;
  from: string;
  to: string;
  unitId?: string;
  officerId?: string;
}) {
  const report = await getReportData({
    ...params,
    includeAllRows: true
  });

  const document = (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Laporan SIMON PST</Text>
        <Text style={pdfStyles.description}>
          Periode {report.filters.from} sampai {report.filters.to}
        </Text>
        <Text style={pdfStyles.description}>
          Petugas {report.officers.find((officer) => officer.id === report.filters.officerId)?.name ?? "Semua petugas"} | Unit {report.units.find((unit) => unit.id === report.filters.unitId)?.name ?? "Semua unit"}
        </Text>
        <Text style={pdfStyles.description}>
          Rata-rata per kriteria: {report.criteriaAverages
            .map(
              (item) =>
                `${item.criteriaName} ${formatAverageScore(item.averageScore)}`
            )
            .join(" | ")}
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
          <Text style={pdfStyles.sectionTitle}>Detail penilaian per petugas</Text>
          {buildGroupedReport(report.rows).map((officer) => (
            <View key={officer.officerId} style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>
                {officer.officerName} | {officer.officerNip} | {officer.unitName}
              </Text>
              {officer.years.map((year) => (
                <View key={`${officer.officerId}-${year.yearKey}`} style={pdfStyles.section}>
                  <Text style={pdfStyles.description}>
                    Tahun {year.yearLabel} | Total tugas {year.totalTasks} | Rata-rata tahunan {formatAverageScore(year.averageScore)}
                  </Text>
                  {year.months.map((month) => (
                    <View
                      key={`${officer.officerId}-${month.monthKey}`}
                      style={pdfStyles.section}
                    >
                      <Text style={pdfStyles.sectionTitle}>{month.monthLabel}</Text>
                      <View style={[pdfStyles.row, pdfStyles.headerRow]}>
                        <Text style={pdfStyles.cellMd}>Tanggal</Text>
                        <Text style={pdfStyles.cellLg}>Status</Text>
                        <Text style={pdfStyles.cellMd}>Rata-rata</Text>
                      </View>
                      {month.details.map((row) => (
                        <View key={row.id} style={pdfStyles.assessmentBlock}>
                          <View style={pdfStyles.row}>
                            <Text style={pdfStyles.cellMd}>
                              {toDateLabel(row.assessmentDate)}
                            </Text>
                            <Text style={pdfStyles.cellLg}>
                              {row.status === "PRESENT" ? "Hadir" : "Tidak Hadir"}
                            </Text>
                            <Text style={pdfStyles.cellMd}>
                              {formatAverageScore(row.averageScore)}
                            </Text>
                          </View>
                          <Text style={pdfStyles.assessmentSummary}>
                            {toCriteriaSummary(row)}
                          </Text>
                        </View>
                      ))}
                      <Text style={pdfStyles.description}>
                        {toCriteriaAverageSummary(month.details, report.criteria)}
                      </Text>
                      <Text style={pdfStyles.description}>
                        Jumlah tugas: {month.totalTasks} kali | Penilaian hadir: {month.presentTaskCount} | Rata-rata nilai {month.monthLabel}: {formatAverageScore(month.averageScore)}
                      </Text>
                    </View>
                  ))}
                  {year.months.length > 1 ? (
                    <View style={pdfStyles.section}>
                      <Text style={pdfStyles.sectionTitle}>
                        Rekap bulanan {year.yearLabel}
                      </Text>
                      <View style={[pdfStyles.row, pdfStyles.headerRow]}>
                        <Text style={pdfStyles.cellLg}>Bulan</Text>
                        <Text style={pdfStyles.cellMd}>Tugas</Text>
                        <Text style={pdfStyles.cellMd}>Hadir</Text>
                        <Text style={pdfStyles.cellMd}>Rata-rata</Text>
                      </View>
                      {year.months.map((month) => (
                        <View
                          key={`${officer.officerId}-${year.yearKey}-${month.monthKey}-recap`}
                          style={pdfStyles.row}
                        >
                          <Text style={pdfStyles.cellLg}>{month.monthLabel}</Text>
                          <Text style={pdfStyles.cellMd}>{month.totalTasks}</Text>
                          <Text style={pdfStyles.cellMd}>{month.presentTaskCount}</Text>
                          <Text style={pdfStyles.cellMd}>
                            {formatAverageScore(month.averageScore)}
                          </Text>
                        </View>
                      ))}
                      <Text style={pdfStyles.description}>
                        Rata-rata tahunan {year.yearLabel}: {formatAverageScore(year.averageScore)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
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

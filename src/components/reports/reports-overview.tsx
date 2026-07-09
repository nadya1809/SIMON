import {
  faArrowTrendUp,
  faCalendarCheck,
  faFileLines,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ReportExportPanel } from "@/components/reports/report-export-panel";
import { ReportFilters } from "@/components/reports/report-filters";
import { EntityIdentityCell } from "@/components/ui/entity-identity-cell";
import { AccentSummaryPanel } from "@/components/ui/accent-summary-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { ModuleTableSection } from "@/components/ui/module-table-section";
import { QueryPaginationBar } from "@/components/ui/query-pagination-bar";
import { StatCard } from "@/components/ui/stat-card";
import { getReportData } from "@/lib/reports";
import { formatAverageScore } from "@/lib/scoring";

type ReportsOverviewProps = {
  report: Awaited<ReturnType<typeof getReportData>>;
  role: string;
};

function toDateLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(value);
}

export function ReportsOverview({ report, role }: ReportsOverviewProps) {
  const topOfficer = report.summary.topOfficer ?? null;

  return (
    <DashboardShell
      title="Laporan dan Export"
      description="Tinjau data penilaian pada periode tertentu, lihat ranking petugas, lalu unduh file Excel atau PDF untuk kebutuhan pelaporan formal."
      role={role}
    >
      <section className="space-y-6">
        <ReportFilters
          key={`${report.filters.timePreset}:${report.filters.unitId || "all"}`}
          units={report.units}
          filters={report.filters}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total Penilaian"
            value={`${report.summary.totalAssessments}`}
            icon={faFileLines}
            iconTone="sky"
          />
          <StatCard
            label="Rata-rata Keseluruhan"
            value={report.summary.overallAverage.toFixed(2)}
            icon={faArrowTrendUp}
            iconTone="teal"
          />
          <StatCard
            label="Petugas Tercakup"
            value={`${report.summary.totalOfficers}`}
            icon={faUsers}
            iconTone="soft"
          />
          <StatCard
            label="Hadir Tercatat"
            value={`${report.summary.totalPresent}`}
            icon={faCalendarCheck}
            iconTone="blue"
          />
          <AccentSummaryPanel
            className="p-6 md:col-span-2"
            eyebrow="Ringkasan Laporan Aktif"
            title={topOfficer?.officerName ?? "Siapkan file laporan aktif"}
            description={
              topOfficer
                ? `${topOfficer.unitName} · rata-rata ${topOfficer.averageScore.toFixed(2)} dari ${topOfficer.totalAssessments} penilaian hadir.`
                : "File export memuat daftar penilaian per tanggal, skor per kriteria, rata-rata nilai, dan ranking petugas sesuai filter yang sedang dipakai."
            }
            meta="Export Excel dan PDF untuk pelaporan formal"
            contentClassName="block"
          />
        </section>

        <ReportExportPanel
          from={report.filters.from}
          to={report.filters.to}
          unitId={report.filters.unitId}
        />

        <ModuleTableSection
          title="Ranking Petugas"
          description={`Ranking dihitung dari rata-rata seluruh assessment berstatus hadir pada periode yang dipilih. ${report.rankingMeta.totalItems} petugas tercakup.`}
          headers={[
            "Peringkat",
            "Petugas",
            "Unit",
            "Rata-rata",
            "Jumlah Penilaian"
          ]}
          isEmpty={!report.ranking.length}
          emptyState={
            <EmptyState
              title="Belum ada ranking pada periode ini"
              description="Ranking akan muncul setelah ada assessment hadir pada rentang tanggal yang dipilih."
              icon="R"
            />
          }
        >
          {report.ranking.map((item) => (
            <tr key={item.officerId} className="border-t border-[var(--border)]">
              <td className="px-5 py-4 font-semibold">#{item.rank}</td>
              <td className="px-5 py-4">
                <EntityIdentityCell
                  name={item.officerName}
                  subtitle={`NIP: ${item.officerNip}`}
                />
              </td>
              <td className="px-5 py-4 text-[var(--muted)]">{item.unitName}</td>
              <td className="px-5 py-4 font-semibold">
                {item.averageScore.toFixed(2)}
              </td>
              <td className="px-5 py-4 text-[var(--muted)]">
                {item.totalAssessments}
              </td>
            </tr>
          ))}
        </ModuleTableSection>

        <QueryPaginationBar
          page={report.rankingMeta.page}
          totalPages={report.rankingMeta.totalPages}
          totalItems={report.rankingMeta.totalItems}
          rowsPerPage={report.rankingMeta.rowsPerPage}
          pageParam="rankingPage"
          rowsPerPageParam="rankingRowsPerPage"
        />

        <ModuleTableSection
          title="Preview Data Laporan"
          description={`Tabel ini menampilkan data utama yang akan masuk ke file export. ${report.previewMeta.totalItems} assessment sesuai filter.`}
          headers={[
            "Tanggal",
            "Petugas",
            "Unit",
            "Status",
            ...report.criteria.map((item) => item.name),
            "Rata-rata"
          ]}
          isEmpty={!report.rows.length}
          emptyState={
            <EmptyState
              title="Tidak ada data laporan untuk filter ini"
              description="Coba ubah rentang tanggal atau filter unit agar data penilaian muncul."
              icon="L"
            />
          }
        >
          {report.rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--border)]">
              <td className="px-5 py-4 font-medium">
                {toDateLabel(row.assessmentDate)}
              </td>
              <td className="px-5 py-4">
                <EntityIdentityCell
                  name={row.officerName}
                  subtitle={`NIP: ${row.officerNip}`}
                />
              </td>
              <td className="px-5 py-4 text-[var(--muted)]">{row.unitName}</td>
              <td className="px-5 py-4 text-[var(--muted)]">
                {row.status === "PRESENT" ? "Hadir" : "Tidak Hadir"}
              </td>
              {row.criteriaScores.map((score) => (
                <td
                  key={`${row.id}-${score.criteriaId}`}
                  className="px-5 py-4 text-[var(--muted)]"
                >
                  {score.score ?? "-"}
                </td>
              ))}
              <td className="px-5 py-4 font-semibold">
                {formatAverageScore(row.averageScore)}
              </td>
            </tr>
          ))}
        </ModuleTableSection>

        <QueryPaginationBar
          page={report.previewMeta.page}
          totalPages={report.previewMeta.totalPages}
          totalItems={report.previewMeta.totalItems}
          rowsPerPage={report.previewMeta.rowsPerPage}
          pageParam="previewPage"
          rowsPerPageParam="previewRowsPerPage"
        />
      </section>
    </DashboardShell>
  );
}

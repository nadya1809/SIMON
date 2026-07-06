import {
  faArrowTrendUp,
  faCalendarCheck,
  faFileLines,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportExportPanel } from "@/components/reports/report-export-panel";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { Table } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth-guard";
import { getReportData } from "@/lib/reports";
import { formatAverageScore } from "@/lib/scoring";

type ReportsPageProps = {
  searchParams?: Promise<{
    timePreset?: string;
    unitId?: string;
  }>;
};

function toDateLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(value);
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await requireAuth();
  const resolvedSearchParams = await searchParams;
  const report = await getReportData({
    timePreset: resolvedSearchParams?.timePreset,
    unitId: resolvedSearchParams?.unitId
  });

  return (
    <DashboardShell
      title="Laporan dan Export"
      description="Tinjau data penilaian pada periode tertentu, lihat ranking petugas, lalu unduh file Excel atau PDF untuk kebutuhan pelaporan formal."
      role={session.user.role}
    >
      <section className="space-y-6">
        <ReportFilters
          key={`${report.filters.timePreset}:${report.filters.unitId || "all"}`}
          units={report.units}
          filters={report.filters}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total penilaian" value={`${report.summary.totalAssessments}`} icon={faFileLines} iconTone="sky" />
          <StatCard label="Petugas tercakup" value={`${report.summary.totalOfficers}`} icon={faUsers} iconTone="teal" />
          <StatCard label="Hadir" value={`${report.summary.totalPresent}`} icon={faCalendarCheck} iconTone="blue" />
          <StatCard label="Rata-rata" value={report.summary.overallAverage.toFixed(2)} icon={faArrowTrendUp} iconTone="soft" />
        </div>

        <ReportExportPanel
          from={report.filters.from}
          to={report.filters.to}
          unitId={report.filters.unitId}
        />

        <SectionCard className="p-5">
          <h3 className="text-lg font-bold">Isi file export</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            File laporan memuat daftar penilaian per tanggal, skor per kriteria,
            rata-rata nilai, dan ranking petugas untuk periode aktif.
          </p>
        </SectionCard>

        <DataTableShell
          title="Ranking petugas"
          description="Ranking dihitung dari rata-rata seluruh assessment berstatus hadir pada periode yang dipilih."
        >
          {report.ranking.length ? (
            <Table
              headers={[
                "Peringkat",
                "Petugas",
                "Unit",
                "Rata-rata",
                "Jumlah penilaian"
              ]}
            >
              {report.ranking.map((item) => (
                <tr key={item.officerId} className="border-t border-[var(--border)]">
                  <td className="px-5 py-4 font-semibold">#{item.rank}</td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold">{item.officerName}</p>
                      <p className="text-xs text-[var(--muted)]">{item.officerNip}</p>
                    </div>
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
            </Table>
          ) : (
            <EmptyState
              title="Belum ada ranking pada periode ini"
              description="Ranking akan muncul setelah ada assessment hadir pada rentang tanggal yang dipilih."
              icon="R"
            />
          )}
        </DataTableShell>

        <DataTableShell
          title="Preview data laporan"
          description="Tabel ini menampilkan data utama yang akan masuk ke file export."
        >
          {report.rows.length ? (
            <Table
              headers={[
                "Tanggal",
                "Petugas",
                "Unit",
                "Status",
                ...report.criteria.map((item) => item.name),
                "Rata-rata"
              ]}
            >
              {report.rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--border)]">
                  <td className="px-5 py-4 font-medium">
                    {toDateLabel(row.assessmentDate)}
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold">{row.officerName}</p>
                      <p className="text-xs text-[var(--muted)]">{row.officerNip}</p>
                    </div>
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
            </Table>
          ) : (
            <EmptyState
              title="Tidak ada data laporan untuk filter ini"
              description="Coba ubah rentang tanggal atau filter unit agar data penilaian muncul."
              icon="L"
            />
          )}
        </DataTableShell>
      </section>
    </DashboardShell>
  );
}

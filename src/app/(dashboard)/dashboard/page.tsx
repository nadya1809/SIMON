import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import {
  CriteriaDistributionChart,
  DailyTrendChart,
  PeriodTrendChart,
  UnitComparisonChart
} from "@/components/charts/dashboard-charts";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth-guard";
import { getDashboardSummary } from "@/lib/dashboard";

type DashboardPageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    unitId?: string;
  }>;
};

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  const session = await requireAuth();
  const resolvedSearchParams = await searchParams;
  const data = await getDashboardSummary({
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
    unitId: resolvedSearchParams?.unitId
  });
  const hasDashboardData = data.summaryCards.totalAssessments > 0;

  return (
    <DashboardShell
      title="Dashboard Monitoring Kinerja"
      description="Lihat tren performa, ranking petugas, distribusi skor kriteria, dan perbandingan antar unit berdasarkan data penilaian harian."
      userName={session.user.name ?? "Pengguna"}
      role={session.user.role}
    >
      <DashboardFilters units={data.units} filters={data.filters} />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Total Penilaian</p>
          <p className="mt-2 text-2xl font-bold">
            {data.summaryCards.totalAssessments}
          </p>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Rata-rata Keseluruhan</p>
          <p className="mt-2 text-2xl font-bold">
            {data.summaryCards.overallAverage.toFixed(2)}
          </p>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Tidak Hadir Tercatat</p>
          <p className="mt-2 text-2xl font-bold">{data.summaryCards.totalAbsent}</p>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Hadir Tercatat</p>
          <p className="mt-2 text-2xl font-bold">{data.summaryCards.totalPresent}</p>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm md:col-span-2">
          <p className="text-sm text-[var(--muted)]">Petugas Teratas</p>
          <p className="mt-2 text-2xl font-bold">
            {data.summaryCards.topOfficer?.officerName ?? "-"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {data.summaryCards.topOfficer
              ? `${data.summaryCards.topOfficer.unitName} · ${data.summaryCards.topOfficer.averageScore.toFixed(2)}`
              : "Belum ada data performa yang cukup untuk dihitung."}
          </p>
        </div>
      </section>

      {hasDashboardData ? (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <DailyTrendChart data={data.trends.daily} />
            <PeriodTrendChart
              weekly={data.trends.weekly}
              monthly={data.trends.monthly}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <CriteriaDistributionChart data={data.criteriaDistribution} />
            <UnitComparisonChart data={data.unitComparison} />
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Ranking Petugas</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Peringkat petugas berdasarkan rata-rata skor pada rentang data
                yang dipilih.
              </p>
            </div>
            <Table
              headers={[
                "Peringkat",
                "Petugas",
                "Unit",
                "Rata-rata",
                "Jumlah Penilaian"
              ]}
            >
              {data.ranking.map((item, index) => (
                <tr key={item.officerId} className="border-t border-[var(--border)]">
                  <td className="px-5 py-4 font-semibold">#{index + 1}</td>
                  <td className="px-5 py-4 font-semibold">{item.officerName}</td>
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
          </section>
        </>
      ) : (
        <EmptyState
          title="Belum ada data dashboard untuk filter ini"
          description="Belum ada penilaian pada rentang tanggal atau unit yang dipilih. Coba ubah filter atau tambahkan data penilaian harian terlebih dahulu."
          icon="PST"
        />
      )}
    </DashboardShell>
  );
}

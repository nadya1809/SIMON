import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import {
  faArrowTrendUp,
  faCalendarCheck,
  faClock,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import {
  CriteriaDistributionChart,
  DailyTrendChart,
  PeriodTrendChart,
  UnitComparisonChart
} from "@/components/charts/dashboard-charts";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { Table } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth-guard";
import { getDashboardSummary } from "@/lib/dashboard";

type DashboardPageProps = {
  searchParams?: Promise<{
    timePreset?: string;
    unitId?: string;
  }>;
};

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  const session = await requireAuth();
  const resolvedSearchParams = await searchParams;
  const data = await getDashboardSummary({
    timePreset: resolvedSearchParams?.timePreset,
    unitId: resolvedSearchParams?.unitId
  });
  const hasDashboardData = data.summaryCards.totalAssessments > 0;

  return (
    <DashboardShell
      title="Dashboard"
      description="Pantau ringkasan kinerja petugas PST, tren penilaian harian, distribusi skor kriteria, dan perbandingan performa antar unit."
      role={session.user.role}
    >
      <DashboardFilters
        key={`${data.filters.timePreset}:${data.filters.unitId || "all"}`}
        units={data.units}
        filters={data.filters}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Penilaian"
          value={`${data.summaryCards.totalAssessments}`}
          icon={faUsers}
          iconTone="sky"
        />
        <StatCard
          label="Rata-rata Keseluruhan"
          value={data.summaryCards.overallAverage.toFixed(2)}
          icon={faArrowTrendUp}
          iconTone="teal"
        />
        <StatCard
          label="Tidak Hadir Tercatat"
          value={`${data.summaryCards.totalAbsent}`}
          icon={faClock}
          iconTone="soft"
        />
        <StatCard
          label="Hadir Tercatat"
          value={`${data.summaryCards.totalPresent}`}
          icon={faCalendarCheck}
          iconTone="blue"
        />
        <SectionCard className="bg-[linear-gradient(135deg,rgba(0,91,154,0.98),rgba(10,111,182,0.93))] p-6 text-white md:col-span-2">
          <p className="text-sm text-white/72">Petugas Teratas</p>
          <p className="mt-2 text-2xl font-bold">
            {data.summaryCards.topOfficer?.officerName ?? "-"}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {data.summaryCards.topOfficer
              ? `${data.summaryCards.topOfficer.unitName} · ${data.summaryCards.topOfficer.averageScore.toFixed(2)}`
              : "Belum ada data performa yang cukup untuk dihitung."}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            Ringkasan eksekutif pelayanan statistik terpadu
          </p>
        </SectionCard>
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

          <SectionCard className="p-6">
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
          </SectionCard>
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

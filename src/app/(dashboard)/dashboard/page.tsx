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
import { AccentSummaryPanel } from "@/components/ui/accent-summary-panel";
import { EntityIdentityCell } from "@/components/ui/entity-identity-cell";
import { EmptyState } from "@/components/ui/empty-state";
import { ModuleTableSection } from "@/components/ui/module-table-section";
import { StatCard } from "@/components/ui/stat-card";
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
        <AccentSummaryPanel
          className="p-6 md:col-span-2"
          eyebrow="Petugas Teratas"
          title={data.summaryCards.topOfficer?.officerName ?? "-"}
          description={
            data.summaryCards.topOfficer
              ? `${data.summaryCards.topOfficer.unitName} · ${data.summaryCards.topOfficer.averageScore.toFixed(2)}`
              : "Belum ada data performa yang cukup untuk dihitung."
          }
          meta="Ringkasan eksekutif pelayanan statistik terpadu"
          contentClassName="block"
        />
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

          <ModuleTableSection
            title="Ranking Petugas"
            description="Peringkat petugas berdasarkan rata-rata skor pada rentang data yang dipilih."
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
                <td className="px-5 py-4">
                  <EntityIdentityCell name={item.officerName} />
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

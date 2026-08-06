import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ReportExportPanel } from "@/components/reports/report-export-panel";
import { RewardPunishmentManagement } from "@/components/reward-punishment/reward-punishment-management";
import { SectionCard } from "@/components/ui/section-card";
import { getReportData } from "@/lib/reports";

type ReportsOverviewProps = {
  report: Awaited<ReturnType<typeof getReportData>>;
  role: string;
  rewardPunishmentProps: React.ComponentProps<typeof RewardPunishmentManagement>;
};

export function ReportsOverview({
  report,
  role,
  rewardPunishmentProps
}: ReportsOverviewProps) {
  return (
    <DashboardShell
      title="Laporan dan Export"
      description="Tinjau data penilaian pada periode tertentu lalu unduh file Excel atau PDF untuk kebutuhan pelaporan formal."
      role={role}
    >
      <section className="space-y-6">
        <SectionCard className="p-5 md:p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Laporan Penilaian Harian
              </h3>
              <p className="text-sm leading-7 text-[var(--muted)]">
                Section ini digunakan untuk menyiapkan unduhan laporan
                penilaian harian sesuai periode aktif. Filter petugas dan unit
                dari laporan utama langsung menjadi dasar data unduhan di bawah
                ini.
              </p>
            </div>

            <ReportExportPanel
              timePreset={report.filters.timePreset}
              from={report.filters.from}
              to={report.filters.to}
              unitId={report.filters.unitId}
              officerId={report.filters.officerId}
              units={report.units}
              officers={report.officers}
            />
          </div>
        </SectionCard>

        <SectionCard className="p-5 md:p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Laporan Evaluasi, Reward, dan Punishment
              </h3>
              <p className="text-sm leading-7 text-[var(--muted)]">
                Section ini digunakan untuk menyiapkan unduhan laporan
                evaluasi, reward, dan punishment sesuai periode aktif. Filter
                petugas dan unit dari laporan utama langsung menjadi dasar data
                unduhan di bawah ini.
              </p>
            </div>

            <RewardPunishmentManagement {...rewardPunishmentProps} />
          </div>
        </SectionCard>
      </section>
    </DashboardShell>
  );
}

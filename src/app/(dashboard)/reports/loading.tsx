import {
  faArrowTrendUp,
  faCalendarCheck,
  faFileLines,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AccentSummaryPanel } from "@/components/ui/accent-summary-panel";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { SectionCard } from "@/components/ui/section-card";
import { Skeleton } from "@/components/ui/skeleton";

function PulseLine({
  className
}: {
  className: string;
}) {
  return <Skeleton className={`rounded-full ${className}`} />;
}

const statToneClasses = [
  "bg-[var(--accent-sky-soft)] text-[var(--accent-sky)]",
  "bg-[var(--accent-teal-soft)] text-[var(--accent-teal)]",
  "bg-[var(--accent-soft)] text-[var(--accent)]",
  "bg-[var(--surface)] text-[var(--muted)]"
];

const statIcons = [faFileLines, faArrowTrendUp, faCalendarCheck, faUsers];
const statLabels = [
  "Total Penilaian",
  "Rata-rata Keseluruhan",
  "Petugas Tercakup",
  "Hadir Tercatat"
];

export default function ReportsLoading() {
  return (
    <DashboardShell
      title="Laporan dan Export"
      description="Tinjau data penilaian pada periode tertentu, lihat ranking petugas, lalu unduh file Excel atau PDF untuk kebutuhan pelaporan formal."
      role="Memuat"
    >
      <section className="space-y-6">
        <FilterToolbar>
          <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Filter waktu
              </p>
              <Skeleton className="h-11 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)]/75" />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Filter unit
              </p>
              <Skeleton className="h-11 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)]/75" />
            </div>
          </div>

          <div className="flex items-end gap-3 xl:min-w-fit">
            <div className="flex h-11 items-center gap-2 text-sm text-[var(--muted)]">
              <Skeleton className="h-2.5 w-2.5 rounded-full bg-[var(--success-fg)]" />
              Filter diterapkan otomatis
            </div>
            <Skeleton className="h-11 w-24 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)]/75" />
          </div>
        </FilterToolbar>

        <section className="grid gap-4 md:grid-cols-3">
          {statLabels.slice(0, 3).map((label, index) => (
            <SectionCard key={index} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="w-full space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {label}
                  </p>
                  <PulseLine className="h-10 w-24" />
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] ${statToneClasses[index]}`}
                >
                  <FontAwesomeIcon
                    icon={statIcons[index]}
                    className="h-4 w-4 opacity-70"
                  />
                </div>
              </div>
            </SectionCard>
          ))}
          <SectionCard className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {statLabels[3]}
                </p>
                <PulseLine className="h-10 w-24" />
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] ${statToneClasses[3]}`}
              >
                <FontAwesomeIcon
                  icon={statIcons[3]}
                  className="h-4 w-4 opacity-70"
                />
              </div>
            </div>
          </SectionCard>
          <AccentSummaryPanel
            eyebrow="Ringkasan Laporan Aktif"
            className="p-6 md:col-span-2"
            contentClassName="block"
          >
            <div className="space-y-3">
              <Skeleton className="h-8 w-72 rounded-full bg-white/20" />
              <Skeleton className="h-4 w-full rounded-full bg-white/15" />
              <Skeleton className="h-4 w-5/6 rounded-full bg-white/15" />
            </div>
          </AccentSummaryPanel>
        </section>

        <SectionCard className="p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent)]">
                  <FontAwesomeIcon
                    icon={faFileLines}
                    className="h-4 w-4 opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <PulseLine className="h-3 w-28" />
                  <PulseLine className="h-6 w-64" />
                </div>
              </div>
              <PulseLine className="h-4 w-full" />
              <PulseLine className="h-4 w-5/6" />
              <PulseLine className="h-3 w-80" />
            </div>
            <div className="flex lg:justify-end">
              <Skeleton className="h-11 w-48 bg-[var(--accent-soft)]" />
            </div>
          </div>
        </SectionCard>

        <DataTableShell
          title="Ranking Petugas"
          description="Ranking dihitung dari rata-rata seluruh assessment berstatus hadir pada periode yang dipilih."
        >
          <div className="space-y-3 px-5 py-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 animate-pulse rounded-[var(--radius-panel)] bg-[var(--surface)]"
              />
            ))}
          </div>
        </DataTableShell>

        <DataTableShell
          title="Preview Data Laporan"
          description="Tabel ini menampilkan data utama yang akan masuk ke file export."
        >
          <div className="space-y-3 px-5 py-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 animate-pulse rounded-[var(--radius-panel)] bg-[var(--surface)]"
              />
            ))}
          </div>
        </DataTableShell>
      </section>
    </DashboardShell>
  );
}

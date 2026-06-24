import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormField } from "@/components/forms/form-field";
import { ReportExportPanel } from "@/components/reports/report-export-panel";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth-guard";
import { getReportData } from "@/lib/reports";
import { formatAverageScore } from "@/lib/scoring";

type ReportsPageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    unitId?: string;
  }>;
};

function toDateLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(value);
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await requireAuth();
  const resolvedSearchParams = await searchParams;
  const report = await getReportData({
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
    unitId: resolvedSearchParams?.unitId
  });

  return (
    <DashboardShell
      title="Laporan dan Export"
      description="Tinjau data penilaian pada periode tertentu, lihat ranking petugas, lalu unduh file Excel atau PDF untuk kebutuhan pelaporan formal."
      userName={session.user.name ?? "Pengguna"}
      role={session.user.role}
    >
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <form
            action="/reports"
            className="grid gap-4 rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4"
          >
            <FormField label="Dari tanggal">
              <DateInput name="from" defaultValue={report.filters.from} />
            </FormField>

            <FormField label="Sampai tanggal">
              <DateInput name="to" defaultValue={report.filters.to} />
            </FormField>

            <FormField label="Filter unit">
              <Select name="unitId" defaultValue={report.filters.unitId}>
                <option value="">Semua unit</option>
                {report.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="flex items-end gap-3">
              <Button className="flex-1" type="submit">
                Terapkan
              </Button>
              <Link
                href="/reports"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Reset
              </Link>
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Total penilaian</p>
              <p className="mt-2 text-2xl font-bold">
                {report.summary.totalAssessments}
              </p>
            </div>
            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Petugas tercakup</p>
              <p className="mt-2 text-2xl font-bold">
                {report.summary.totalOfficers}
              </p>
            </div>
            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Hadir</p>
              <p className="mt-2 text-2xl font-bold">{report.summary.totalPresent}</p>
            </div>
            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Rata-rata</p>
              <p className="mt-2 text-2xl font-bold">
                {report.summary.overallAverage.toFixed(2)}
              </p>
            </div>
          </div>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Ranking petugas</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Ranking dihitung dari rata-rata seluruh assessment berstatus hadir
                pada periode yang dipilih.
              </p>
            </div>

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
          </section>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Preview data laporan</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Tabel ini menampilkan data utama yang akan masuk ke file export.
              </p>
            </div>

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
          </section>
        </div>

        <div className="space-y-6">
          <ReportExportPanel
            from={report.filters.from}
            to={report.filters.to}
            unitId={report.filters.unitId}
          />

          <div className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold">Isi file export</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              File laporan memuat daftar penilaian per tanggal, skor per kriteria,
              rata-rata nilai, dan ranking petugas untuk periode aktif.
            </p>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

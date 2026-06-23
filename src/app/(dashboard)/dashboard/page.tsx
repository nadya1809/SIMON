import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth-guard";

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <DashboardShell
      title="Selamat datang di SIMON PST"
      description="Fondasi autentikasi, layout dashboard, dan komponen UI bersama sudah siap. Modul berikutnya tinggal menumpang di struktur ini agar implementasi fitur lebih cepat dan konsisten."
      userName={session.user.name ?? "Pengguna"}
      role={session.user.role}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Pengguna Aktif</p>
          <p className="mt-2 text-2xl font-bold">{session.user.name}</p>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Peran</p>
          <p className="mt-2 text-2xl font-bold">{session.user.role}</p>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">Status Fondasi</p>
            <Badge variant="success">Siap</Badge>
          </div>
          <p className="mt-2 text-2xl font-bold">UI Shared Aktif</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Table
          headers={["Modul", "Status", "Catatan"]}
          className="shadow-sm"
        >
          <tr className="border-t border-[var(--border)]">
            <td className="px-5 py-4 font-semibold">Auth & Session</td>
            <td className="px-5 py-4">
              <Badge variant="success">Selesai</Badge>
            </td>
            <td className="px-5 py-4 text-[var(--muted)]">
              Login, middleware, dan dashboard guard sudah aktif.
            </td>
          </tr>
          <tr className="border-t border-[var(--border)]">
            <td className="px-5 py-4 font-semibold">Komponen Bersama</td>
            <td className="px-5 py-4">
              <Badge variant="success">Selesai</Badge>
            </td>
            <td className="px-5 py-4 text-[var(--muted)]">
              Button, input, table, state component, dan layout siap dipakai.
            </td>
          </tr>
          <tr className="border-t border-[var(--border)]">
            <td className="px-5 py-4 font-semibold">Master Data</td>
            <td className="px-5 py-4">
              <Badge variant="warning">Berikutnya</Badge>
            </td>
            <td className="px-5 py-4 text-[var(--muted)]">
              Akan dimulai dari unit, petugas, kriteria, dan user.
            </td>
          </tr>
        </Table>

        <EmptyState
          title="Belum ada data operasional"
          description="Setelah master data dan penilaian harian dibuat, area ini akan menampilkan ringkasan skor, ranking petugas, dan tren performa."
          icon="PST"
        />
      </section>
    </DashboardShell>
  );
}

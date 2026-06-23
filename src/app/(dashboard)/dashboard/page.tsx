import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold">Selamat datang di SIMON PST</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Fondasi autentikasi dan struktur dashboard sudah aktif. Fase berikutnya
          akan menambahkan master data, penilaian harian, visualisasi, dan
          pelaporan.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Pengguna Aktif</p>
          <p className="mt-2 text-2xl font-bold">{session?.user.name}</p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Peran</p>
          <p className="mt-2 text-2xl font-bold">{session?.user.role}</p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Status Fondasi</p>
          <p className="mt-2 text-2xl font-bold">Siap</p>
        </div>
      </section>
    </main>
  );
}

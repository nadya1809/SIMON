import { ReactNode } from "react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { requireAuth } from "@/lib/auth-guard";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen gap-6 px-4 py-6 md:px-6">
        <aside className="hidden w-80 rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfe_100%)] p-6 shadow-sm lg:block">
          <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
              SIMON PST
            </p>
            <h2 className="mt-2 text-xl font-bold">
              BPS Provinsi Sumatera Barat
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Dashboard monitoring kinerja petugas PST untuk Admin, Supervisor,
              dan Pimpinan.
            </p>
          </div>
          <div className="my-6 h-px bg-[var(--border)]" />
          <SidebarNav />
          <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-sm text-[var(--muted)]">Pengguna aktif</p>
            <p className="mt-2 font-bold">{session.user.name}</p>
            <p className="text-sm text-[var(--muted)]">{session.user.role}</p>
          </div>
        </aside>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

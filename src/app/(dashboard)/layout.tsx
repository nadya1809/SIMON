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
        <aside className="hidden w-80 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm lg:block">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
              SIMON PST
            </p>
            <h2 className="text-xl font-bold">Panel Monitoring Kinerja</h2>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Fondasi navigasi utama untuk Admin, Supervisor, dan Pimpinan.
            </p>
          </div>
          <div className="my-6 h-px bg-[var(--border)]" />
          <SidebarNav />
          <div className="mt-6 rounded-3xl bg-[var(--surface)] p-4">
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

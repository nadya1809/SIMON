import { ReactNode } from "react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";
import { requireAuth } from "@/lib/auth-guard";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen gap-5 px-4 py-5 md:px-6">
        <aside className="hidden w-72 rounded-[var(--radius-card)] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfe_100%)] p-5 shadow-[var(--shadow-md)] lg:block">
          <div className="rounded-[var(--radius-panel)] bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] p-4 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
              SIMON PST
            </p>
            <h2 className="mt-2 text-lg font-bold">
              BPS Provinsi Sumatera Barat
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/78">
              Sistem monitoring kinerja petugas pelayanan statistik terpadu.
            </p>
          </div>
          <div className="my-6 h-px bg-[var(--border)]" />
          <SidebarNav />
        </aside>

        <div className="flex-1">
          <Topbar
            userName={session.user.name ?? "Pengguna"}
            role={session.user.role}
          />
          {children}
        </div>
      </div>
    </div>
  );
}

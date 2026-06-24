"use client";

import { ReactNode, useEffect, useState } from "react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";

type DashboardFrameProps = {
  children: ReactNode;
  role: string;
  userName: string;
};

export function DashboardFrame({
  children,
  role,
  userName
}: DashboardFrameProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen gap-5 px-4 py-5 md:px-6">
        {isSidebarOpen ? (
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            className="fixed inset-0 z-30 bg-[rgba(19,39,56,0.26)] backdrop-blur-[2px] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

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
          <SidebarNav onNavigate={() => setIsSidebarOpen(false)} />
        </aside>

        <aside
          className={`fixed inset-y-4 left-4 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfe_100%)] p-5 shadow-[0_30px_80px_rgba(24,50,71,0.18)] transition duration-200 lg:hidden ${
            isSidebarOpen
              ? "translate-x-0 opacity-100"
              : "-translate-x-[110%] opacity-0"
          }`}
        >
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
          <SidebarNav onNavigate={() => setIsSidebarOpen(false)} />
        </aside>

        <div className="min-w-0 flex-1">
          <Topbar
            userName={userName}
            role={role}
            onMenuToggle={() => setIsSidebarOpen((current) => !current)}
          />
          {children}
        </div>
      </div>
    </div>
  );
}

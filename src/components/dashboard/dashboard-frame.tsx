"use client";

import { ReactNode, useState } from "react";
import { SidebarBrand } from "@/components/dashboard/sidebar-brand";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

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
  useBodyScrollLock(isSidebarOpen);

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

        <aside className="sticky top-5 hidden max-h-[calc(100vh-2.5rem)] w-72 self-start overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfe_100%)] p-5 shadow-[var(--shadow-md)] lg:block">
          <SidebarBrand />
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
          <SidebarBrand compact />
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

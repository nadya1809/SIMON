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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  useBodyScrollLock(isSidebarOpen);

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <div className="mx-auto min-h-screen px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
        {isSidebarOpen ? (
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            className="fixed inset-0 z-30 bg-[rgba(19,39,56,0.26)] backdrop-blur-[2px] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-5 left-6 z-20 hidden overflow-y-auto overscroll-contain rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel-bg)] p-5 shadow-[var(--shadow-md)] transition-[width,padding] duration-300 lg:block ${
            isSidebarCollapsed ? "w-28 px-3" : "w-72"
          }`}
        >
          <SidebarBrand collapsed={isSidebarCollapsed} />
          <div className="my-6 h-px bg-[var(--border)]" />
          <SidebarNav
            collapsed={isSidebarCollapsed}
            onNavigate={() => setIsSidebarOpen(false)}
          />
        </aside>

        <aside
          className={`fixed inset-y-4 left-4 z-40 max-h-[calc(100dvh-2rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_30px_80px_rgba(24,50,71,0.18)] transition duration-200 lg:hidden ${
            isSidebarOpen
              ? "translate-x-0 opacity-100"
              : "-translate-x-[110%] opacity-0"
          }`}
        >
          <SidebarBrand compact />
          <div className="my-6 h-px bg-[var(--border)]" />
          <SidebarNav onNavigate={() => setIsSidebarOpen(false)} />
        </aside>

        <div
          className={`min-w-0 overflow-x-hidden transition-[margin] duration-300 ${
            isSidebarCollapsed ? "lg:ml-[8.75rem]" : "lg:ml-[19.25rem]"
          }`}
        >
          <Topbar
            userName={userName}
            role={role}
            onMenuToggle={() => setIsSidebarOpen((current) => !current)}
            isSidebarCollapsed={isSidebarCollapsed}
            onSidebarCollapseToggle={() =>
              setIsSidebarCollapsed((current) => !current)
            }
          />
          {children}
        </div>
      </div>
    </div>
  );
}

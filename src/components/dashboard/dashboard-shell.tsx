import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/dashboard/logout-button";

type DashboardShellProps = {
  title: string;
  description: string;
  userName: string;
  role: string;
  children: ReactNode;
};

export function DashboardShell({
  title,
  description,
  userName,
  role,
  children
}: DashboardShellProps) {
  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="success">Akses Aktif</Badge>
              <span className="text-sm text-[var(--muted)]">{role}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 rounded-3xl bg-[var(--surface)] p-4 lg:items-end">
            <p className="text-sm text-[var(--muted)]">Masuk sebagai</p>
            <p className="text-lg font-bold">{userName}</p>
            <LogoutButton />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

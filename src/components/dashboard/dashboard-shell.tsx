import { ReactNode } from "react";
import { PageHeader } from "@/components/dashboard/page-header";

type DashboardShellProps = {
  title: string;
  description: string;
  userName?: string;
  role: string;
  children: ReactNode;
};

export function DashboardShell({
  title,
  description,
  role,
  children
}: DashboardShellProps) {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader title={title} description={description} role={role} />
      {children}
    </div>
  );
}

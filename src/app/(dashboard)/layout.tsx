import { ReactNode } from "react";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { requireAuth } from "@/lib/auth-guard";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await requireAuth();

  return (
    <DashboardFrame
      userName={session.user.name ?? "Pengguna"}
      role={session.user.role}
    >
      {children}
    </DashboardFrame>
  );
}

import { prisma } from "@/lib/prisma";
import { requireRolesPage } from "@/lib/auth-guard";
import { OfficerManagement } from "@/components/officers/officer-management";

export default async function OfficersPage() {
  const session = await requireRolesPage(["ADMIN"]);

  const [officers, units] = await Promise.all([
    prisma.officer.findMany({
      include: {
        unit: true
      },
      orderBy: [{ name: "asc" }]
    }),
    prisma.unit.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true
      }
    })
  ]);

  return (
    <OfficerManagement
      initialOfficers={officers}
      units={units}
      userName={session.user.name ?? "Admin"}
      role={session.user.role}
    />
  );
}

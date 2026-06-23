import { prisma } from "@/lib/prisma";
import { requireRolesPage } from "@/lib/auth-guard";
import { UnitManagement } from "@/components/units/unit-management";

export default async function UnitsPage() {
  const session = await requireRolesPage(["ADMIN"]);

  const units = await prisma.unit.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          officers: true
        }
      }
    }
  });

  return (
    <UnitManagement
      initialUnits={units}
      userName={session.user.name ?? "Admin"}
      role={session.user.role}
    />
  );
}

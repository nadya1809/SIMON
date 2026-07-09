import { prisma } from "@/lib/prisma";
import { requireRolesPage } from "@/lib/auth-guard";
import { UnitManagement } from "@/components/units/unit-management";
import { createPaginationMeta } from "@/lib/pagination";

export default async function UnitsPage() {
  const session = await requireRolesPage(["ADMIN"]);

  const rowsPerPage = 10;
  const totalItems = await prisma.unit.count();
  const meta = createPaginationMeta(totalItems, 1, rowsPerPage);
  const units = await prisma.unit.findMany({
    skip: 0,
    take: rowsPerPage,
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
      initialUnits={{ data: units, meta }}
      userName={session.user.name ?? "Admin"}
      role={session.user.role}
    />
  );
}

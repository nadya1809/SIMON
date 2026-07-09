import { prisma } from "@/lib/prisma";
import { requireRolesPage } from "@/lib/auth-guard";
import { OfficerManagement } from "@/components/officers/officer-management";
import { createPaginationMeta } from "@/lib/pagination";

export default async function OfficersPage() {
  const session = await requireRolesPage(["ADMIN"]);

  const rowsPerPage = 10;
  const totalItems = await prisma.officer.count();
  const meta = createPaginationMeta(totalItems, 1, rowsPerPage);
  const [officers, units] = await Promise.all([
    prisma.officer.findMany({
      skip: 0,
      take: rowsPerPage,
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
      initialOfficers={{ data: officers, meta }}
      units={units}
      userName={session.user.name ?? "Admin"}
      role={session.user.role}
    />
  );
}

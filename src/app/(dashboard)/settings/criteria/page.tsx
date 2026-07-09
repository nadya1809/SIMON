import { prisma } from "@/lib/prisma";
import { requireRolesPage } from "@/lib/auth-guard";
import { CriteriaManagement } from "@/components/criteria/criteria-management";
import { createPaginationMeta } from "@/lib/pagination";

export default async function CriteriaPage() {
  const session = await requireRolesPage(["ADMIN"]);

  const rowsPerPage = 10;
  const totalItems = await prisma.criteria.count();
  const meta = createPaginationMeta(totalItems, 1, rowsPerPage);
  const criteria = await prisma.criteria.findMany({
    skip: 0,
    take: rowsPerPage,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          scores: true
        }
      }
    }
  });

  return (
    <CriteriaManagement
      initialCriteria={{ data: criteria, meta }}
      userName={session.user.name ?? "Admin"}
      role={session.user.role}
    />
  );
}

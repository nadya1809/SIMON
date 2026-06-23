import { prisma } from "@/lib/prisma";
import { requireRolesPage } from "@/lib/auth-guard";
import { CriteriaManagement } from "@/components/criteria/criteria-management";

export default async function CriteriaPage() {
  const session = await requireRolesPage(["ADMIN"]);

  const criteria = await prisma.criteria.findMany({
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
      initialCriteria={criteria}
      userName={session.user.name ?? "Admin"}
      role={session.user.role}
    />
  );
}

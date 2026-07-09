import { prisma } from "@/lib/prisma";
import { requireRolesPage } from "@/lib/auth-guard";
import { UserManagement } from "@/components/users/user-management";
import { createPaginationMeta } from "@/lib/pagination";

export default async function UsersPage() {
  const session = await requireRolesPage(["ADMIN"]);

  const rowsPerPage = 10;
  const totalItems = await prisma.user.count();
  const meta = createPaginationMeta(totalItems, 1, rowsPerPage);
  const users = await prisma.user.findMany({
    skip: 0,
    take: rowsPerPage,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return (
    <UserManagement
      initialUsers={{ data: users, meta }}
      currentUserId={session.user.id}
      userName={session.user.name ?? "Admin"}
      role={session.user.role}
    />
  );
}

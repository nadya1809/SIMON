import { prisma } from "@/lib/prisma";
import { requireRolesPage } from "@/lib/auth-guard";
import { UserManagement } from "@/components/users/user-management";

export default async function UsersPage() {
  const session = await requireRolesPage(["ADMIN"]);

  const users = await prisma.user.findMany({
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
      initialUsers={users}
      currentUserId={session.user.id}
      userName={session.user.name ?? "Admin"}
      role={session.user.role}
    />
  );
}

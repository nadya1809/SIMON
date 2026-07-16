import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { NotificationsManagement } from "@/components/notifications/notifications-management";
import { serializeNotificationListItem } from "@/lib/notifications";

type NotificationsPageProps = {
  searchParams?: Promise<{
    info?: string;
  }>;
};

export default async function NotificationsPage({
  searchParams
}: NotificationsPageProps) {
  const session = await requireAuth();
  const resolvedSearchParams = await searchParams;

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 30
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    })
  ]);

  return (
    <NotificationsManagement
      initialItems={items.map(serializeNotificationListItem)}
      unreadCount={unreadCount}
      role={session.user.role}
      infoMessage={resolvedSearchParams?.info}
    />
  );
}

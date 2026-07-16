import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  buildNotificationInfoHref,
  markNotificationAsRead,
  resolveNotificationNavigation
} from "@/lib/notifications";

type NotificationOpenPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NotificationOpenPage({
  params
}: NotificationOpenPageProps) {
  const session = await requireAuth();
  const { id } = await params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: session.user.id
    }
  });

  if (!notification) {
    redirect(
      buildNotificationInfoHref("Notifikasi yang dipilih tidak ditemukan.")
    );
  }

  const navigation = await resolveNotificationNavigation(
    notification,
    session.user.role
  );

  if (navigation.status !== "ok") {
    redirect(buildNotificationInfoHref(navigation.message));
  }

  await markNotificationAsRead(session.user.id, notification.id);
  redirect(navigation.href);
}

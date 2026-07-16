import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";
import { apiSuccess, apiUnauthorized } from "@/lib/api-response";
import {
  ensureDailyAssessmentReminderForUser,
  serializeNotificationListItem
} from "@/lib/notifications";

export async function GET(request: Request) {
  const { session, response } = await requireApiAuth();

  if (response) {
    return response;
  }

  if (!session?.user) {
    return apiUnauthorized();
  }

  await ensureDailyAssessmentReminderForUser(
    session.user.id,
    session.user.role
  );

  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "8", 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 20)
    : 8;

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    })
  ]);

  return apiSuccess(items.map(serializeNotificationListItem), {
    meta: {
      unreadCount,
      limit
    }
  });
}

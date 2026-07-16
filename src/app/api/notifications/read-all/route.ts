import { requireApiAuth } from "@/lib/auth-guard";
import { apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { markAllNotificationsAsRead } from "@/lib/notifications";

export async function PATCH() {
  const { session, response } = await requireApiAuth();

  if (response) {
    return response;
  }

  if (!session?.user) {
    return apiUnauthorized();
  }

  const result = await markAllNotificationsAsRead(session.user.id);

  return apiSuccess(
    {
      updatedCount: result.count
    },
    {
      message: "Semua notifikasi berhasil ditandai sebagai sudah dibaca."
    }
  );
}

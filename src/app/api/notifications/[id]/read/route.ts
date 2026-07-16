import { requireApiAuth } from "@/lib/auth-guard";
import { apiNotFound, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { markNotificationAsRead } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const { session, response } = await requireApiAuth();

  if (response) {
    return response;
  }

  if (!session?.user) {
    return apiUnauthorized();
  }

  const { id } = await context.params;
  const result = await markNotificationAsRead(session.user.id, id);

  if (!result.count) {
    return apiNotFound("Notifikasi tidak ditemukan.");
  }

  return apiSuccess(
    {
      updatedCount: result.count
    },
    {
      message: "Notifikasi berhasil ditandai sebagai sudah dibaca."
    }
  );
}

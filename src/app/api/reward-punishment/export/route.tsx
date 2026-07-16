import { requireApiAuth } from "@/lib/auth-guard";
import { apiValidationError } from "@/lib/api-response";
import { logServerError } from "@/lib/logger";
import {
  buildRewardPunishmentExcelBuffer,
  buildRewardPunishmentExportBaseName,
  buildRewardPunishmentPdfBuffer
} from "@/lib/reward-punishment-export";
import { rewardPunishmentExportSchema } from "@/lib/validations/reward-punishment";

export async function GET(request: Request) {
  try {
    const { response } = await requireApiAuth();

    if (response) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const parsed = rewardPunishmentExportSchema.safeParse({
      format: searchParams.get("format")?.trim(),
      search: searchParams.get("search")?.trim() || "",
      officerId: searchParams.get("officerId")?.trim() || "",
      unitId: searchParams.get("unitId")?.trim() || "",
      type: searchParams.get("type")?.trim() || "",
      status: searchParams.get("status")?.trim() || "",
      from: searchParams.get("from")?.trim() || "",
      to: searchParams.get("to")?.trim() || ""
    });

    if (!parsed.success) {
      return apiValidationError(
        "Parameter export tidak valid.",
        parsed.error.flatten().fieldErrors
      );
    }

    const { format, ...filters } = parsed.data;
    const fileBaseName = buildRewardPunishmentExportBaseName({
      from: filters.from,
      to: filters.to
    });
    const buffer =
      format === "xlsx"
        ? await buildRewardPunishmentExcelBuffer(filters)
        : await buildRewardPunishmentPdfBuffer(filters);
    const contentType =
      format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";
    const extension = format === "xlsx" ? "xlsx" : "pdf";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileBaseName}.${extension}"`,
        "Content-Length": String(buffer.byteLength)
      }
    });
  } catch (error) {
    logServerError("api.reward-punishment.export", error);
    throw error;
  }
}

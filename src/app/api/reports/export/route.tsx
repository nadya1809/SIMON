import { requireApiAuth } from "@/lib/auth-guard";
import { reportExportSchema } from "@/lib/validations/report";
import { apiValidationError } from "@/lib/api-response";
import { logServerError } from "@/lib/logger";
import {
  buildExcelReportBuffer,
  buildPdfReportBuffer,
  buildReportFileBaseName
} from "@/lib/report-export";

export async function GET(request: Request) {
  try {
    const { response } = await requireApiAuth();

    if (response) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const parsed = reportExportSchema.safeParse({
      format: searchParams.get("format")?.trim(),
      from: searchParams.get("from")?.trim() || "",
      to: searchParams.get("to")?.trim() || "",
      unitId: searchParams.get("unitId")?.trim() || ""
    });

    if (!parsed.success) {
      return apiValidationError(
        "Parameter export tidak valid.",
        parsed.error.flatten().fieldErrors
      );
    }

    const { format, from, to, unitId } = parsed.data;
    const resolvedFrom = from || "";
    const resolvedTo = to || "";
    const fileBaseName = buildReportFileBaseName(
      resolvedFrom || "default",
      resolvedTo || "default"
    );
    const buffer =
      format === "xlsx"
        ? await buildExcelReportBuffer({
            from: resolvedFrom,
            to: resolvedTo,
            unitId
          })
        : await buildPdfReportBuffer({
            from: resolvedFrom,
            to: resolvedTo,
            unitId
          });
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
    logServerError("api.reports.export", error);
    throw error;
  }
}

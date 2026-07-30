import { requireApiAuth } from "@/lib/auth-guard";
import {
  apiSuccess,
  apiValidationError
} from "@/lib/api-response";
import { isDateInputValue } from "@/lib/date-only";
import { logServerError } from "@/lib/logger";
import { getUserAssessmentReference } from "@/lib/user-assessment-reference";

export async function GET(request: Request) {
  const { response } = await requireApiAuth();

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const nip = searchParams.get("nip")?.trim() || "";
  const assessmentDate = searchParams.get("assessmentDate")?.trim() || "";

  if (!nip || !/^\d+$/.test(nip)) {
    return apiValidationError("NIP referensi penilaian pengguna tidak valid.", {
      nip: ["NIP wajib berupa angka."]
    });
  }

  if (!isDateInputValue(assessmentDate)) {
    return apiValidationError(
      "Tanggal referensi penilaian pengguna tidak valid.",
      {
        assessmentDate: ["Tanggal wajib memakai format YYYY-MM-DD."]
      }
    );
  }

  try {
    const reference = await getUserAssessmentReference({
      nip,
      assessmentDate
    });

    return apiSuccess(reference);
  } catch (error) {
    logServerError("api.user-assessment-reference", error, {
      nip,
      assessmentDate
    });

    return apiSuccess(null, {
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengambil referensi penilaian pengguna."
    });
  }
}

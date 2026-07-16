import { z } from "zod";
import {
  dateInputString,
  optionalTrimmedText
} from "@/lib/validations/shared";

export const assessmentStatusSchema = z.enum(["PRESENT", "ABSENT"]);

export const assessmentScoreSchema = z.object({
  criteriaId: z.string().trim().min(1, "Kriteria wajib ada."),
  score: z.coerce
    .number()
    .int("Skor harus berupa angka bulat.")
    .min(1, "Skor minimal 1.")
    .max(100, "Skor maksimal 100.")
});

export const assessmentSchema = z.object({
  officerId: z.string().trim().min(1, "Petugas wajib dipilih."),
  assessmentDate: dateInputString(
    "Tanggal penilaian wajib diisi.",
    "Tanggal penilaian wajib memakai tanggal yang valid."
  ),
  status: assessmentStatusSchema,
  notes: optionalTrimmedText(255, "Catatan maksimal 255 karakter."),
  scores: z.array(assessmentScoreSchema).default([])
});

export type AssessmentFormValues = z.output<typeof assessmentSchema>;
export type AssessmentFormInput = z.input<typeof assessmentSchema>;

export function validateAssessmentBusinessRules(params: {
  activeCriteriaIds: string[];
  status: "PRESENT" | "ABSENT";
  scores: Array<{ criteriaId: string; score: number }>;
}) {
  const { activeCriteriaIds, status, scores } = params;

  if (status === "ABSENT") {
    if (scores.length > 0) {
      return "Petugas tidak hadir tidak boleh memiliki skor kriteria.";
    }

    return null;
  }

  const missingCriteria = activeCriteriaIds.filter(
    (criteriaId) => !scores.some((score) => score.criteriaId === criteriaId)
  );

  if (missingCriteria.length > 0) {
    return "Semua kriteria aktif wajib diisi saat status hadir.";
  }

  return null;
}

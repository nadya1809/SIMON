import { z } from "zod";
import {
  LETTERS_ONLY_MESSAGE,
  SORT_ORDER_NUMERIC_ONLY_MESSAGE,
  lettersOnlyPattern
} from "@/lib/input-rules";
import { optionalTrimmedText } from "@/lib/validations/shared";

export const criteriaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kriteria minimal 2 karakter.")
    .max(100, "Nama kriteria maksimal 100 karakter.")
    .regex(lettersOnlyPattern, LETTERS_ONLY_MESSAGE),
  description: optionalTrimmedText(255, "Deskripsi maksimal 255 karakter."),
  sortOrder: z.coerce
    .number()
    .int(SORT_ORDER_NUMERIC_ONLY_MESSAGE)
    .min(0, "Urutan tampil tidak boleh kurang dari 0.")
    .max(999, "Urutan tampil maksimal 999."),
  isActive: z.boolean()
});

export const criteriaUpdateSchema = criteriaSchema;

export type CriteriaFormInput = z.input<typeof criteriaSchema>;
export type CriteriaFormValues = z.output<typeof criteriaSchema>;

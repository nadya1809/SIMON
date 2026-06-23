import { z } from "zod";

export const criteriaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kriteria minimal 2 karakter.")
    .max(100, "Nama kriteria maksimal 100 karakter."),
  description: z
    .string()
    .trim()
    .max(255, "Deskripsi maksimal 255 karakter.")
    .optional()
    .or(z.literal("")),
  sortOrder: z.coerce
    .number()
    .int("Urutan tampil harus berupa angka bulat.")
    .min(0, "Urutan tampil tidak boleh kurang dari 0.")
    .max(999, "Urutan tampil maksimal 999."),
  isActive: z.boolean()
});

export const criteriaUpdateSchema = criteriaSchema;

export type CriteriaFormInput = z.input<typeof criteriaSchema>;
export type CriteriaFormValues = z.output<typeof criteriaSchema>;

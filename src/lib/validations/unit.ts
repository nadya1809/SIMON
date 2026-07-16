import { z } from "zod";
import { optionalTrimmedText } from "@/lib/validations/shared";

export const unitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama unit minimal 2 karakter.")
    .max(100, "Nama unit maksimal 100 karakter."),
  description: optionalTrimmedText(
    255,
    "Deskripsi unit maksimal 255 karakter."
  )
});

export const unitUpdateSchema = unitSchema;

export type UnitFormValues = z.infer<typeof unitSchema>;

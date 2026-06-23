import { z } from "zod";

export const unitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama unit minimal 2 karakter.")
    .max(100, "Nama unit maksimal 100 karakter."),
  description: z
    .string()
    .trim()
    .max(255, "Deskripsi unit maksimal 255 karakter.")
    .optional()
    .or(z.literal(""))
});

export const unitUpdateSchema = unitSchema;

export type UnitFormValues = z.infer<typeof unitSchema>;

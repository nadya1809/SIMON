import { z } from "zod";

export const officerSchema = z.object({
  nip: z
    .string()
    .trim()
    .min(5, "NIP minimal 5 karakter.")
    .max(30, "NIP maksimal 30 karakter."),
  name: z
    .string()
    .trim()
    .min(2, "Nama petugas minimal 2 karakter.")
    .max(120, "Nama petugas maksimal 120 karakter."),
  position: z
    .string()
    .trim()
    .max(120, "Posisi maksimal 120 karakter.")
    .optional()
    .or(z.literal("")),
  unitId: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean()
});

export const officerUpdateSchema = officerSchema;

export type OfficerFormValues = z.infer<typeof officerSchema>;

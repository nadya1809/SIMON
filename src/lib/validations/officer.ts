import { z } from "zod";
import {
  LETTERS_ONLY_MESSAGE,
  NUMERIC_ONLY_MESSAGE,
  lettersOnlyPattern,
  numericOnlyPattern
} from "@/lib/input-rules";

export const officerJabatanOptions = [
  "Statistisi ahli pertama",
  "Statistisi ahli muda"
] as const;

export const officerSchema = z.object({
  nip: z
    .string()
    .trim()
    .min(5, "NIP minimal 5 karakter.")
    .max(30, "NIP maksimal 30 karakter.")
    .regex(numericOnlyPattern, NUMERIC_ONLY_MESSAGE),
  name: z
    .string()
    .trim()
    .min(2, "Nama petugas minimal 2 karakter.")
    .max(120, "Nama petugas maksimal 120 karakter.")
    .regex(lettersOnlyPattern, LETTERS_ONLY_MESSAGE),
  jabatan: z.enum(officerJabatanOptions).optional().or(z.literal("")),
  unitId: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean()
});

export const officerUpdateSchema = officerSchema;

export type OfficerFormValues = z.infer<typeof officerSchema>;
export type OfficerJabatanOption = (typeof officerJabatanOptions)[number];

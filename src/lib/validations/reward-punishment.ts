import { z } from "zod";

export const rewardPunishmentGenerationSchema = z.object({
  period: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "Periode wajib memakai format YYYY-MM."),
  rewardCategory: z
    .string()
    .trim()
    .min(1, "Kategori reward wajib diisi.")
    .max(100, "Kategori reward maksimal 100 karakter."),
  punishmentCategory: z
    .string()
    .trim()
    .min(1, "Kategori punishment wajib diisi.")
    .max(100, "Kategori punishment maksimal 100 karakter."),
  notes: z
    .string()
    .trim()
    .max(255, "Catatan maksimal 255 karakter.")
    .optional()
    .or(z.literal(""))
});

export const rewardPunishmentActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  category: z
    .string()
    .trim()
    .max(100, "Kategori maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(255, "Catatan maksimal 255 karakter.")
    .optional()
    .or(z.literal(""))
});

export type RewardPunishmentGenerationValues = z.output<
  typeof rewardPunishmentGenerationSchema
>;
export type RewardPunishmentGenerationInput = z.input<
  typeof rewardPunishmentGenerationSchema
>;

export type RewardPunishmentActionValues = z.output<
  typeof rewardPunishmentActionSchema
>;
export type RewardPunishmentActionInput = z.input<
  typeof rewardPunishmentActionSchema
>;

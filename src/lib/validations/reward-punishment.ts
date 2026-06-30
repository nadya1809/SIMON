import { z } from "zod";

export const rewardPunishmentGenerationSchema = z.object({
  periodKind: z.enum([
    "DAILY",
    "WORKWEEK",
    "MONTHLY",
    "QUARTERLY",
    "SEMIANNUAL",
    "YEARLY"
  ]),
  referenceDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal acuan wajib memakai format YYYY-MM-DD."),
  generationMode: z.enum([
    "EVALUASI",
    "REWARD",
    "PUNISHMENT",
    "REWARD_PUNISHMENT"
  ]),
  evaluationCategory: z
    .string()
    .trim()
    .max(100, "Kategori evaluasi maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  rewardCategory: z
    .string()
    .trim()
    .max(100, "Kategori reward maksimal 100 karakter."),
  punishmentCategory: z
    .string()
    .trim()
    .max(100, "Kategori punishment maksimal 100 karakter."),
  notes: z
    .string()
    .trim()
    .max(255, "Catatan maksimal 255 karakter.")
    .optional()
    .or(z.literal(""))
}).superRefine((value, ctx) => {
  if (
    value.generationMode === "EVALUASI" &&
    !(value.evaluationCategory ?? "").trim()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["evaluationCategory"],
      message: "Kategori evaluasi wajib diisi."
    });
  }

  if (
    (value.generationMode === "REWARD" ||
      value.generationMode === "REWARD_PUNISHMENT") &&
    !value.rewardCategory.trim()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["rewardCategory"],
      message: "Kategori reward wajib diisi."
    });
  }

  if (
    (value.generationMode === "PUNISHMENT" ||
      value.generationMode === "REWARD_PUNISHMENT") &&
    !value.punishmentCategory.trim()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["punishmentCategory"],
      message: "Kategori punishment wajib diisi."
    });
  }
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

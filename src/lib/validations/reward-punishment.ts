import { z } from "zod";
import { isDateInputValue } from "@/lib/date-only";
import {
  optionalDateInputString,
  optionalTrimmedText
} from "@/lib/validations/shared";

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
    .min(1, "Tanggal acuan wajib diisi.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal acuan wajib memakai format YYYY-MM-DD.")
    .refine(
      isDateInputValue,
      "Tanggal acuan wajib memakai tanggal yang valid."
    ),
  generationMode: z.enum([
    "EVALUASI",
    "REWARD",
    "PUNISHMENT",
    "REWARD_PUNISHMENT"
  ]),
  evaluationCategory: optionalTrimmedText(
    100,
    "Kategori evaluasi maksimal 100 karakter."
  ),
  rewardCategory: z
    .string()
    .trim()
    .max(100, "Kategori reward maksimal 100 karakter."),
  punishmentCategory: z
    .string()
    .trim()
    .max(100, "Kategori punishment maksimal 100 karakter."),
  notes: optionalTrimmedText(255, "Catatan maksimal 255 karakter.")
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
  category: optionalTrimmedText(100, "Kategori maksimal 100 karakter."),
  notes: optionalTrimmedText(255, "Catatan maksimal 255 karakter.")
});

export const rewardPunishmentExportSchema = z
  .object({
    format: z.enum(["pdf", "xlsx"], {
      message: "Format export harus pdf atau xlsx."
    }),
    search: z.string().trim().optional().or(z.literal("")),
    officerId: z.string().trim().optional().or(z.literal("")),
    unitId: z.string().trim().optional().or(z.literal("")),
    status: z.string().trim().optional().or(z.literal("")),
    type: z.string().trim().optional().or(z.literal("")),
    from: optionalDateInputString(
      "Tanggal mulai wajib memakai tanggal yang valid."
    ),
    to: optionalDateInputString(
      "Tanggal akhir wajib memakai tanggal yang valid."
    )
  })
  .refine(
    (value) => {
      if (value.from && value.to) {
        return value.from <= value.to;
      }

      return true;
    },
    {
      message: "Tanggal mulai tidak boleh lebih besar dari tanggal akhir.",
      path: ["to"]
    }
  );

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

export type RewardPunishmentExportValues = z.output<
  typeof rewardPunishmentExportSchema
>;

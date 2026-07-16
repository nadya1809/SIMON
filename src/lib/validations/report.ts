import { z } from "zod";
import { optionalDateInputString } from "@/lib/validations/shared";

export const reportExportSchema = z
  .object({
    format: z.enum(["pdf", "xlsx"], {
      message: "Format export harus pdf atau xlsx."
    }),
    search: z.string().trim().optional().or(z.literal("")),
    from: optionalDateInputString(
      "Tanggal mulai wajib memakai tanggal yang valid."
    ),
    to: optionalDateInputString(
      "Tanggal akhir wajib memakai tanggal yang valid."
    ),
    unitId: z.string().trim().optional().or(z.literal("")),
    officerId: z.string().trim().optional().or(z.literal(""))
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

export type ReportExportValues = z.output<typeof reportExportSchema>;

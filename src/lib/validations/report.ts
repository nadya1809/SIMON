import { z } from "zod";

export const reportExportSchema = z
  .object({
    format: z.enum(["pdf", "xlsx"], {
      message: "Format export harus pdf atau xlsx."
    }),
    from: z.string().trim().optional().or(z.literal("")),
    to: z.string().trim().optional().or(z.literal("")),
    unitId: z.string().trim().optional().or(z.literal(""))
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

import { z } from "zod";
import { optionalDateInputString } from "@/lib/validations/shared";

export const officerHistoryFilterSchema = z
  .object({
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
      path: ["to"],
      message: "Tanggal mulai tidak boleh lebih besar dari tanggal akhir."
    }
  );

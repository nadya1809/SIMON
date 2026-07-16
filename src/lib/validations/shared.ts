import { z } from "zod";
import { isDateInputValue } from "@/lib/date-only";

export const emptyString = z.literal("");

export function optionalTrimmedText(maxLength: number, message: string) {
  return z.string().trim().max(maxLength, message).optional().or(emptyString);
}

export function dateInputString(messageRequired: string, messageInvalid: string) {
  return z
    .string()
    .trim()
    .min(1, messageRequired)
    .refine(isDateInputValue, messageInvalid);
}

export function optionalDateInputString(messageInvalid: string) {
  return z
    .string()
    .trim()
    .refine((value) => !value || isDateInputValue(value), messageInvalid)
    .optional()
    .or(emptyString);
}

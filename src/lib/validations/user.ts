import { z } from "zod";

export const userSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(120, "Nama maksimal 120 karakter."),
  email: z
    .string()
    .trim()
    .email("Email tidak valid.")
    .max(120, "Email maksimal 120 karakter."),
  role: z.enum(["ADMIN", "SUPERVISOR", "PIMPINAN"]),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(100, "Password maksimal 100 karakter."),
  isActive: z.boolean()
});

export const userUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(120, "Nama maksimal 120 karakter."),
  email: z
    .string()
    .trim()
    .email("Email tidak valid.")
    .max(120, "Email maksimal 120 karakter."),
  role: z.enum(["ADMIN", "SUPERVISOR", "PIMPINAN"]),
  password: z
    .string()
    .trim()
    .max(100, "Password maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean()
});

export type UserFormValues = z.output<typeof userSchema>;
export type UserFormInput = z.input<typeof userSchema>;
export type UserUpdateFormValues = z.output<typeof userUpdateSchema>;
export type UserUpdateFormInput = z.input<typeof userUpdateSchema>;

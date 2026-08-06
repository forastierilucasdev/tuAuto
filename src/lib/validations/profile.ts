import { z } from "zod";
import { businessNameSchema, dniSchema, fullNameSchema, passwordSchema, phoneSchema } from "@/lib/validations/shared";

export const updateParticularProfileSchema = z.object({
  fullName: fullNameSchema,
  dni: dniSchema,
  phone: phoneSchema,
});

export const updateAgencyProfileSchema = updateParticularProfileSchema.extend({
  businessName: businessNameSchema,
  city: z.string().trim().max(80).optional(),
  province: z.string().trim().max(80).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Ingresá tu contraseña actual." }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { error: "Confirmá tu nueva contraseña." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

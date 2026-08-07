import { z } from "zod";
import { passwordSchema } from "@/lib/validations/shared";
import { registerAgenciaSchema, registerConcesionariaSchema, registerParticularSchema } from "@/lib/validations/auth";

// Reutiliza los schemas de registro (mismas reglas para nombre/dni/teléfono/
// cuit/razón social) sin email ni password, que en el perfil no se editan
// acá — el email es de solo lectura y la contraseña tiene su propio flujo
// (ver changePasswordSchema).
export const updateParticularProfileSchema = registerParticularSchema.omit({
  email: true,
  password: true,
});

const agencyOnlyFields = {
  city: z.string().trim().max(80).optional(),
  province: z.string().trim().max(80).optional(),
  description: z.string().trim().max(1000).optional(),
  address: z.string().trim().max(200).optional(),
  website: z.string().trim().max(200).optional(),
};

export const updateAgenciaProfileSchema = registerAgenciaSchema
  .omit({ email: true, password: true })
  .extend(agencyOnlyFields);

export const updateConcesionariaProfileSchema = registerConcesionariaSchema
  .omit({ email: true, password: true })
  .extend(agencyOnlyFields);

export const updateProfileSchema = z.discriminatedUnion("accountType", [
  updateParticularProfileSchema,
  updateAgenciaProfileSchema,
  updateConcesionariaProfileSchema,
]);

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

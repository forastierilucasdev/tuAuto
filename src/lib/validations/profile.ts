import { z } from "zod";

const fullNameSchema = z.string().trim().min(3, { error: "Ingresá apellido y nombre." }).max(120);

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{8,15}$/, { error: "Ingresá un teléfono válido (solo números, opcionalmente con +)." });

export const updateParticularProfileSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema,
});

export const updateAgencyProfileSchema = updateParticularProfileSchema.extend({
  businessName: z
    .string()
    .trim()
    .min(2, { error: "Ingresá el nombre de la concesionaria o agencia." })
    .max(120),
  city: z.string().trim().max(80).optional(),
  province: z.string().trim().max(80).optional(),
  description: z.string().trim().max(1000).optional(),
});

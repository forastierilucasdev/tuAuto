import { z } from "zod";
import { businessNameSchema, cuitSchema, dniSchema, emailSchema, fullNameSchema, passwordSchema, phoneSchema } from "@/lib/validations/shared";

// Schemas Zod compartidos entre formularios (cliente) y Server Actions
// (servidor). El servidor es siempre la fuente de verdad — nunca confiar
// solo en la validación del cliente.

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Ingresá tu contraseña." }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const registerParticularSchema = z.object({
  accountType: z.literal("PARTICULAR"),
  fullName: fullNameSchema,
  dni: dniSchema,
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const registerAgenciaSchema = z.object({
  accountType: z.literal("AGENCIA"),
  businessName: businessNameSchema,
  cuit: cuitSchema,
  fullName: fullNameSchema,
  dni: dniSchema,
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const registerConcesionariaSchema = z.object({
  accountType: z.literal("CONCESIONARIA"),
  businessName: businessNameSchema,
  cuit: cuitSchema,
  fullName: fullNameSchema,
  dni: dniSchema,
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.discriminatedUnion("accountType", [
  registerParticularSchema,
  registerAgenciaSchema,
  registerConcesionariaSchema,
]);

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterParticularInput = z.infer<typeof registerParticularSchema>;
export type RegisterAgenciaInput = z.infer<typeof registerAgenciaSchema>;
export type RegisterConcesionariaInput = z.infer<typeof registerConcesionariaSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

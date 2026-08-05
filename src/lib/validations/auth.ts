import { z } from "zod";

// Schemas Zod compartidos entre formularios (cliente) y Server Actions
// (servidor). El servidor es siempre la fuente de verdad — nunca confiar
// solo en la validación del cliente.

const emailSchema = z
  .email({ error: "Ingresá un email válido." })
  .trim()
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, { error: "La contraseña debe tener al menos 8 caracteres." })
  .regex(/[a-zA-Z]/, { error: "Debe contener al menos una letra." })
  .regex(/[0-9]/, { error: "Debe contener al menos un número." });

const dniSchema = z
  .string()
  .trim()
  .regex(/^\d{7,8}$/, { error: "El DNI debe tener 7 u 8 dígitos, sin puntos." });

const cuitSchema = z
  .string()
  .trim()
  .regex(/^\d{2}-?\d{8}-?\d{1}$/, { error: "El CUIT debe tener el formato XX-XXXXXXXX-X." });

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{8,15}$/, { error: "Ingresá un teléfono válido (solo números, opcionalmente con +)." });

const fullNameSchema = z
  .string()
  .trim()
  .min(3, { error: "Ingresá apellido y nombre." })
  .max(120);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Ingresá tu contraseña." }),
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
  businessName: z
    .string()
    .trim()
    .min(2, { error: "Ingresá el nombre de la concesionaria o agencia." })
    .max(120),
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
]);

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterParticularInput = z.infer<typeof registerParticularSchema>;
export type RegisterAgenciaInput = z.infer<typeof registerAgenciaSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

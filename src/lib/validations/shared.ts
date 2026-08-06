import { z } from "zod";

// Primitivas Zod reutilizadas por auth.ts, profile.ts y listing.ts — única
// fuente de verdad para estas reglas de validación.

export const emailSchema = z
  .email({ error: "Ingresá un email válido." })
  .trim()
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, { error: "La contraseña debe tener al menos 8 caracteres." })
  .regex(/[a-zA-Z]/, { error: "Debe contener al menos una letra." })
  .regex(/[0-9]/, { error: "Debe contener al menos un número." });

export const dniSchema = z
  .string()
  .trim()
  .regex(/^\d{7,8}$/, { error: "El DNI debe tener 7 u 8 dígitos, sin puntos." });

export const cuitSchema = z
  .string()
  .trim()
  .regex(/^\d{2}-?\d{8}-?\d{1}$/, { error: "El CUIT debe tener el formato XX-XXXXXXXX-X." });

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{8,15}$/, { error: "Ingresá un teléfono válido (solo números, opcionalmente con +)." });

export const fullNameSchema = z.string().trim().min(3, { error: "Ingresá apellido y nombre." }).max(120);

export const businessNameSchema = z
  .string()
  .trim()
  .min(2, { error: "Ingresá el nombre de la agencia o concesionaria." })
  .max(120);

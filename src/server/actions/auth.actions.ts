"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { forgotPasswordSchema, loginSchema, registerSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  createBusinessUser,
  createParticularUser,
  cuitExists,
  dniExists,
  emailExists,
} from "@/server/data/users";

export type ActionState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;

  const limited = rateLimit(`register:${data.email}`, { max: 5, windowMs: 15 * 60_000 });
  if (!limited.success) {
    return { error: "Demasiados intentos de registro. Probá de nuevo en unos minutos." };
  }

  if (await emailExists(data.email)) {
    return { error: "Ya existe una cuenta registrada con ese email." };
  }
  if (await dniExists(data.dni)) {
    return { error: "Ya existe una cuenta registrada con ese DNI." };
  }
  if (data.accountType !== "PARTICULAR" && (await cuitExists(data.cuit))) {
    return { error: "Ya existe una cuenta registrada con ese CUIT." };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  if (data.accountType === "PARTICULAR") {
    await createParticularUser({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      dni: data.dni,
      phone: data.phone,
    });
  } else {
    await createBusinessUser({
      accountType: data.accountType,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      dni: data.dni,
      phone: data.phone,
      businessName: data.businessName,
      cuit: data.cuit,
    });
  }

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "La cuenta se creó, pero no pudimos iniciar sesión automáticamente. Ingresá manualmente." };
    }
    throw error;
  }
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const limited = rateLimit(`login-action:${parsed.data.email}`, { max: 8, windowMs: 5 * 60_000 });
  if (!limited.success) {
    return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." };
    }
    throw error;
  }
}

export type ForgotPasswordState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

/**
 * Mock: todavía no hay envío de emails configurado (ver ERRORES.md), así que
 * esta acción no genera ni envía ningún link de recuperación real. Siempre
 * devuelve el mismo mensaje genérico exista o no la cuenta, para no revelar
 * qué emails están registrados (buena práctica de seguridad, más allá del mock).
 */
export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const raw = Object.fromEntries(formData);
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const limited = rateLimit(`forgot-password:${parsed.data.email}`, { max: 5, windowMs: 15 * 60_000 });
  if (!limited.success) {
    return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  return { success: true };
}

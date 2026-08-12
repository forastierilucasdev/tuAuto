"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { forgotPasswordSchema, loginSchema, registerSchema } from "@/lib/validations/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  createBusinessUser,
  createParticularUser,
  cuitExists,
  dniExists,
  emailExists,
} from "@/server/data/users";

export type ActionState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

/**
 * Crea la cuenta y valida datos server-side (unicidad de email/DNI/CUIT,
 * hash de contraseña), pero **no** inicia sesión acá: el sign-in real lo
 * hace el cliente (`RegisterForm`) llamando a `signIn()` de `next-auth/react`
 * después de un `success: true`. Si el `signIn()` server-side de Auth.js se
 * invoca desde una Server Action, el cookie de sesión queda seteado
 * correctamente pero el estado cliente de `SessionProvider` (usado por
 * `useSession()` en el Header/AccountMenu) no se entera — solo se actualiza
 * cuando el sign-in se dispara desde el cliente. Ver ERRORES.md.
 */
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

  const ip = getClientIp(await headers());
  const limited = await rateLimit(`register:${data.email}`, { max: 5, windowMs: 15 * 60_000 });
  const ipLimited = await rateLimit(`register-ip:${ip}`, { max: 20, windowMs: 15 * 60_000 });
  if (!limited.success || !ipLimited.success) {
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

  return { success: true };
}

/**
 * Solo valida el formato y aplica rate limiting — el sign-in real (que
 * verifica la contraseña vía `authorize()`) lo dispara el cliente
 * (`LoginForm`) con `signIn()` de `next-auth/react` para que el estado de
 * sesión del `SessionProvider` quede sincronizado sin necesitar un refresh
 * manual. Ver el comentario en `registerAction` y ERRORES.md.
 */
export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const ip = getClientIp(await headers());
  const limited = await rateLimit(`login-action:${parsed.data.email}`, { max: 8, windowMs: 5 * 60_000 });
  const ipLimited = await rateLimit(`login-action-ip:${ip}`, { max: 30, windowMs: 5 * 60_000 });
  if (!limited.success || !ipLimited.success) {
    return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  return { success: true };
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

  const ip = getClientIp(await headers());
  const limited = await rateLimit(`forgot-password:${parsed.data.email}`, { max: 5, windowMs: 15 * 60_000 });
  const ipLimited = await rateLimit(`forgot-password-ip:${ip}`, { max: 20, windowMs: 15 * 60_000 });
  if (!limited.success || !ipLimited.success) {
    return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  return { success: true };
}

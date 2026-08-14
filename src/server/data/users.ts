import "server-only";
import { prisma } from "@/lib/prisma";
import type { AccountType, AdminRole, User } from "@/generated/prisma/client";

export type SafeUser = {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  dni: string;
  phone: string;
  createdAt: Date;
};

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    accountType: user.accountType,
    dni: user.dni,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

/** Usado tanto del lado del usuario (mostrar su propio estado) como en el resto de la app — ver también `isUserSuspended` en `server/data/admin/users.ts` (misma lógica, versión del lado admin). */
export function isUserSuspended(suspendedUntil: Date | null): boolean {
  return Boolean(suspendedUntil && suspendedUntil.getTime() > Date.now());
}

/** Único uso permitido es dentro de `authorize()` de Auth.js, para comparar el hash. */
export async function findUserForAuth(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Usado por el callback `jwt` de Auth.js en cada request para invalidar
 * sesiones cuya `sessionVersion` quedó vieja (cambio de contraseña), cuya
 * cuenta se desactivó/baneó, o se borró lógicamente — `null` significa
 * "sesión ya no válida". De paso devuelve `adminRole` vigente, así un
 * cambio de rol (o un ban/borrado a un admin) se aplica en el próximo
 * request sin plomería nueva.
 */
export async function getSessionState(
  userId: string
): Promise<{ sessionVersion: number; adminRole: AdminRole | null } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true, isActive: true, deletedAt: true, adminRole: true },
  });
  if (!user || !user.isActive || user.deletedAt) return null;
  return { sessionVersion: user.sessionVersion, adminRole: user.adminRole };
}

// Bloqueo de login solo para cuentas de admin (`adminRole` no nulo) — un
// usuario normal nunca pasa por estas dos funciones, ver `authorize()` en
// `lib/auth.ts`. Aplicarlo a cualquier cuenta abriría una forma de bloquear
// a propósito a un vendedor real fallando su contraseña a repetición.
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
const ADMIN_LOGIN_LOCK_MS = 30 * 60_000;

/** Se llama con la contraseña incorrecta en una cuenta de admin — al llegar al máximo, bloquea por `ADMIN_LOGIN_LOCK_MS` y reinicia el contador. */
export async function recordFailedAdminLogin(userId: string) {
  const { failedLoginAttempts } = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
    select: { failedLoginAttempts: true },
  });
  if (failedLoginAttempts >= ADMIN_LOGIN_MAX_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: new Date(Date.now() + ADMIN_LOGIN_LOCK_MS), failedLoginAttempts: 0 },
    });
  }
}

/**
 * Login de admin exitoso: reinicia el contador de intentos y, de paso,
 * incrementa `sessionVersion` — reutiliza el mismo mecanismo de
 * invalidación que ya existe para el cambio de contraseña (ver
 * `updatePassword`) para forzar "sesión única": cualquier JWT de admin
 * emitido antes de este login queda desincronizado y se corta en su
 * próximo request (`getSessionState` de arriba). Devuelve el nuevo
 * `sessionVersion` para que el JWT recién emitido ya nazca al día.
 */
export async function recordSuccessfulAdminLogin(userId: string): Promise<number> {
  const { sessionVersion } = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  return sessionVersion;
}

export async function getFullProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      accountType: true,
      dni: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      activationCount: true,
      purchasedPublications: true,
      featuredVouchersGranted: true,
      featuredVouchersUsed: true,
      isVerified: true,
      isActive: true,
      suspendedUntil: true,
      suspensionReason: true,
      agencyProfile: {
        select: {
          businessName: true,
          city: true,
          province: true,
          description: true,
          cuit: true,
          logoUrl: true,
          address: true,
          website: true,
        },
      },
    },
  });
}

export async function findSafeUserById(id: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toSafeUser(user) : null;
}

export async function touchLastLogin(id: string) {
  await prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
}

export async function emailExists(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return Boolean(user);
}

export async function dniExists(dni: string, excludeUserId?: string) {
  const user = await prisma.user.findUnique({ where: { dni }, select: { id: true } });
  if (!user) return false;
  return user.id !== excludeUserId;
}

export async function cuitExists(cuit: string, excludeUserId?: string) {
  const profile = await prisma.agencyProfile.findUnique({ where: { cuit }, select: { userId: true } });
  if (!profile) return false;
  return profile.userId !== excludeUserId;
}

export async function createParticularUser(data: {
  email: string;
  passwordHash: string;
  fullName: string;
  dni: string;
  phone: string;
}): Promise<SafeUser> {
  const user = await prisma.user.create({
    data: { ...data, accountType: "PARTICULAR" },
  });
  return toSafeUser(user);
}

export async function createBusinessUser(data: {
  accountType: "AGENCIA" | "CONCESIONARIA";
  email: string;
  passwordHash: string;
  fullName: string;
  dni: string;
  phone: string;
  businessName: string;
  cuit: string;
}): Promise<SafeUser> {
  const { businessName, cuit, accountType, ...userData } = data;
  const user = await prisma.user.create({
    data: {
      ...userData,
      accountType,
      agencyProfile: { create: { businessName, cuit } },
    },
  });
  return toSafeUser(user);
}

export async function updateProfile(
  id: string,
  data: Partial<Pick<User, "fullName" | "dni" | "phone" | "avatarUrl" | "accountType">> & {
    agencyProfile?: {
      businessName?: string;
      cuit?: string;
      city?: string;
      province?: string;
      description?: string;
      logoUrl?: string;
      address?: string;
      website?: string;
    };
  }
) {
  const { agencyProfile, ...userData } = data;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userData,
      ...(agencyProfile ? { agencyProfile: { update: agencyProfile } } : {}),
    },
  });
  return toSafeUser(user);
}

/** Cambia una cuenta Particular a Agencia/Concesionaria: crea el AgencyProfile que antes no existía. */
export async function convertToBusinessAccount(
  id: string,
  accountType: "AGENCIA" | "CONCESIONARIA",
  data: {
    fullName: string;
    dni: string;
    phone: string;
    avatarUrl?: string;
    businessName: string;
    cuit: string;
    city?: string;
    province?: string;
    description?: string;
    logoUrl?: string;
    address?: string;
    website?: string;
  }
) {
  const { businessName, cuit, city, province, description, logoUrl, address, website, ...userData } = data;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userData,
      accountType,
      agencyProfile: { create: { businessName, cuit, city, province, description, logoUrl, address, website } },
    },
  });
  return toSafeUser(user);
}

/** Cambia una cuenta Agencia/Concesionaria a Particular: borra el AgencyProfile asociado. */
export async function convertToParticularAccount(
  id: string,
  data: { fullName: string; dni: string; phone: string; avatarUrl?: string }
) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      accountType: "PARTICULAR",
      agencyProfile: { delete: true },
    },
  });
  return toSafeUser(user);
}

/** Incrementa `sessionVersion` junto con el hash — invalida cualquier sesión (JWT) emitida antes del cambio. */
export async function updatePassword(id: string, passwordHash: string) {
  await prisma.user.update({ where: { id }, data: { passwordHash, sessionVersion: { increment: 1 } } });
}

export async function createVerificationRequest(input: {
  userId: string;
  fullName: string;
  dni: string;
  phone: string;
  dniFrontPath: string;
  dniBackPath: string;
}) {
  return prisma.verificationRequest.create({ data: input });
}

export async function getLatestVerificationRequest(userId: string) {
  return prisma.verificationRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

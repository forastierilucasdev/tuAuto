import "server-only";
import { prisma } from "@/lib/prisma";
import type { AccountType, AdminRole, Prisma } from "@/generated/prisma/client";

export type AdminUserFilters = {
  search?: string;
  accountType?: AccountType;
  isActive?: boolean;
  adminRole?: AdminRole | "NONE";
  showDeleted?: boolean;
};

const ADMIN_USER_PAGE_SIZE = 25;

function buildUserWhere(filters: AdminUserFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    deletedAt: filters.showDeleted ? { not: null } : null,
  };

  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: "insensitive" } },
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { dni: { contains: filters.search } },
    ];
  }
  if (filters.accountType) where.accountType = filters.accountType;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.adminRole === "NONE") where.adminRole = null;
  else if (filters.adminRole) where.adminRole = filters.adminRole;

  return where;
}

export async function listUsersForAdmin(filters: AdminUserFilters, page = 1) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const where = buildUserWhere(filters);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ADMIN_USER_PAGE_SIZE,
      take: ADMIN_USER_PAGE_SIZE,
      select: {
        id: true,
        email: true,
        fullName: true,
        accountType: true,
        isActive: true,
        isVerified: true,
        adminRole: true,
        deletedAt: true,
        suspendedUntil: true,
        createdAt: true,
        // Última solicitud de verificación — una sola query, sin N+1
        // (Prisma soporta `take` dentro de una relación anidada).
        verificationRequests: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: safePage, totalPages: Math.max(1, Math.ceil(total / ADMIN_USER_PAGE_SIZE)) };
}

/** Sin paginar — usado por la exportación CSV, que baja todo lo que coincide con el filtro actual, no solo la página visible. */
export async function listAllUsersForAdmin(filters: AdminUserFilters) {
  return prisma.user.findMany({
    where: buildUserWhere(filters),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      dni: true,
      phone: true,
      accountType: true,
      isActive: true,
      isVerified: true,
      adminRole: true,
      deletedAt: true,
      suspendedUntil: true,
      createdAt: true,
    },
  });
}

export async function getUserForAdmin(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { agencyProfile: true },
  });
}

/** Ban/desban: reversible, no oculta las publicaciones del usuario — mismo criterio que ya tenía `isActive` (solo gatea el login). */
export async function setUserActive(userId: string, isActive: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { isActive } });
}

/** Borrado lógico: la fila sigue en la base, se excluye de toda lectura pública/del dueño (ver `server/data/listings.ts`/`users.ts`) y no puede loguearse más. */
export async function softDeleteUser(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date(), isActive: false } });
}

export async function restoreUser(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { deletedAt: null } });
}

export async function setUserAdminRole(userId: string, adminRole: AdminRole | null) {
  return prisma.user.update({ where: { id: userId }, data: { adminRole } });
}

/** Levanta el bloqueo por intentos fallidos (ver `recordFailedAdminLogin` en `server/data/users.ts`) antes de que venza solo. */
export async function unlockUserLogin(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { failedLoginAttempts: 0, lockedUntil: null } });
}

export function isAccountLocked(lockedUntil: Date | null): boolean {
  return Boolean(lockedUntil && lockedUntil.getTime() > Date.now());
}

/**
 * Suspensión temporal de la cuenta (días + motivo) — a diferencia de un ban
 * (`setUserActive(false)`), el usuario SIGUE pudiendo loguearse: lo que
 * cambia es que sus publicaciones dejan de ser públicas y no puede
 * publicar/reactivar mientras dure (ver `visibleStatusWhere()`/
 * `loadActivationContext()` en `server/data/listings.ts`). Se levanta sola
 * al pasar `suspendedUntil`, o a mano con `unsuspendUser`.
 */
export async function suspendUser(userId: string, days: number, reason: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { suspendedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000), suspensionReason: reason },
  });
}

export async function unsuspendUser(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { suspendedUntil: null, suspensionReason: null } });
}

export function isUserSuspended(suspendedUntil: Date | null): boolean {
  return Boolean(suspendedUntil && suspendedUntil.getTime() > Date.now());
}

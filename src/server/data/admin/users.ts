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

export async function listUsersForAdmin(filters: AdminUserFilters, page = 1) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
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
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: safePage, totalPages: Math.max(1, Math.ceil(total / ADMIN_USER_PAGE_SIZE)) };
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

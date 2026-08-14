"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission, requireSuperAdminRole } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import {
  getUserForAdmin,
  restoreUser,
  setUserActive,
  setUserAdminRole,
  softDeleteUser,
  suspendUser,
  unlockUserLogin,
  unsuspendUser,
} from "@/server/data/admin/users";
import type { AdminRole } from "@/generated/prisma/client";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

export async function banUserAction(userId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("usuarios", "edit");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };

  await setUserActive(userId, false);
  await logAdminAction({
    adminId: session.user.id,
    action: "user.ban",
    targetTable: "User",
    targetId: userId,
    changes: { before: { isActive: before.isActive }, after: { isActive: false } },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

export async function unbanUserAction(userId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("usuarios", "edit");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };

  await setUserActive(userId, true);
  await logAdminAction({
    adminId: session.user.id,
    action: "user.unban",
    targetTable: "User",
    targetId: userId,
    changes: { before: { isActive: before.isActive }, after: { isActive: true } },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

export async function softDeleteUserAction(userId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("usuarios", "delete");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };
  if (before.adminRole) return { error: "No podés borrar una cuenta de administrador — primero quitale el rol." };

  await softDeleteUser(userId);
  await logAdminAction({
    adminId: session.user.id,
    action: "user.softDelete",
    targetTable: "User",
    targetId: userId,
    changes: { before: { deletedAt: before.deletedAt, isActive: before.isActive }, after: { deletedAt: new Date(), isActive: false } },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

export async function restoreUserAction(userId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("usuarios", "delete");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };

  await restoreUser(userId);
  await logAdminAction({
    adminId: session.user.id,
    action: "user.restore",
    targetTable: "User",
    targetId: userId,
    changes: { before: { deletedAt: before.deletedAt }, after: { deletedAt: null } },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

export async function unlockUserLoginAction(userId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("usuarios", "edit");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };

  await unlockUserLogin(userId);
  await logAdminAction({
    adminId: session.user.id,
    action: "user.unlockLogin",
    targetTable: "User",
    targetId: userId,
    changes: {
      before: { failedLoginAttempts: before.failedLoginAttempts, lockedUntil: before.lockedUntil },
      after: { failedLoginAttempts: 0, lockedUntil: null },
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

export async function suspendUserAction(userId: string, days: number, reason: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("usuarios", "edit");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };

  const user = await suspendUser(userId, days, reason);
  await logAdminAction({
    adminId: session.user.id,
    action: "user.suspend",
    targetTable: "User",
    targetId: userId,
    changes: {
      before: { suspendedUntil: before.suspendedUntil, suspensionReason: before.suspensionReason },
      after: { suspendedUntil: user.suspendedUntil, suspensionReason: user.suspensionReason },
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  revalidatePath("/catalogo");
  revalidatePath("/dashboard/perfil");
  return { success: true };
}

export async function unsuspendUserAction(userId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("usuarios", "edit");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };

  await unsuspendUser(userId);
  await logAdminAction({
    adminId: session.user.id,
    action: "user.unsuspend",
    targetTable: "User",
    targetId: userId,
    changes: { before: { suspendedUntil: before.suspendedUntil }, after: { suspendedUntil: null } },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  revalidatePath("/catalogo");
  revalidatePath("/dashboard/perfil");
  return { success: true };
}

/** Único lugar donde se escribe `User.adminRole` — crear/degradar/quitar un admin, exclusivo de Superadmin. */
export async function assignAdminRoleAction(userId: string, role: AdminRole | null): Promise<AdminActionState> {
  const session = await requireAdminPermission("usuarios", "edit");
  requireSuperAdminRole(session.user.adminRole);

  if (userId === session.user.id && role !== "SUPERADMIN") {
    return { error: "No podés quitarte tu propio rol de Superadministrador." };
  }

  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };

  await setUserAdminRole(userId, role);
  await logAdminAction({
    adminId: session.user.id,
    action: "user.setAdminRole",
    targetTable: "User",
    targetId: userId,
    changes: { before: { adminRole: before.adminRole }, after: { adminRole: role } },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

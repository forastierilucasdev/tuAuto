"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import { getUserForAdmin } from "@/server/data/admin/users";
import {
  adjustFeaturedVouchers,
  adjustPurchasedPublications,
  cancelSubscription,
  grantSubscription,
  togglePlanActive,
} from "@/server/data/admin/subscriptions";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

export async function grantSubscriptionAction(userId: string, planCode: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("suscripciones", "edit");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };

  let result;
  try {
    result = await grantSubscription(userId, planCode, session.user.id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo otorgar el plan." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "subscription.grant",
    targetTable: "User",
    targetId: userId,
    changes: {
      before: { subscriptionQuota: before.subscriptionQuota, subscriptionExpiresAt: before.subscriptionExpiresAt },
      after: { subscriptionQuota: result.subscriptionQuota, subscriptionExpiresAt: result.subscriptionExpiresAt },
    },
  });

  revalidatePath("/admin/suscripciones");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

export async function cancelSubscriptionAction(userId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("suscripciones", "edit");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };

  await cancelSubscription(userId);
  await logAdminAction({
    adminId: session.user.id,
    action: "subscription.cancel",
    targetTable: "User",
    targetId: userId,
    changes: {
      before: { subscriptionQuota: before.subscriptionQuota, subscriptionExpiresAt: before.subscriptionExpiresAt },
      after: { subscriptionQuota: 0, subscriptionExpiresAt: new Date() },
    },
  });

  revalidatePath("/admin/suscripciones");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

export async function adjustPurchasedPublicationsAction(userId: string, delta: number): Promise<AdminActionState> {
  const session = await requireAdminPermission("suscripciones", "edit");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };
  if (before.purchasedPublications + delta < 0) return { error: "El ajuste dejaría el cupo en negativo." };

  await adjustPurchasedPublications(userId, delta);
  await logAdminAction({
    adminId: session.user.id,
    action: "subscription.adjustPurchasedPublications",
    targetTable: "User",
    targetId: userId,
    changes: {
      before: { purchasedPublications: before.purchasedPublications },
      after: { purchasedPublications: before.purchasedPublications + delta },
    },
  });

  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

export async function adjustFeaturedVouchersAction(userId: string, delta: number): Promise<AdminActionState> {
  const session = await requireAdminPermission("suscripciones", "edit");
  const before = await getUserForAdmin(userId);
  if (!before) return { error: "Usuario no encontrado." };
  if (before.pendingFeaturedVouchers + delta < 0) return { error: "El ajuste dejaría los vouchers en negativo." };

  await adjustFeaturedVouchers(userId, delta);
  await logAdminAction({
    adminId: session.user.id,
    action: "subscription.adjustFeaturedVouchers",
    targetTable: "User",
    targetId: userId,
    changes: {
      before: { pendingFeaturedVouchers: before.pendingFeaturedVouchers },
      after: { pendingFeaturedVouchers: before.pendingFeaturedVouchers + delta },
    },
  });

  revalidatePath(`/admin/usuarios/${userId}`);
  return { success: true };
}

export async function togglePlanActiveAction(planCode: string, isActive: boolean): Promise<AdminActionState> {
  const session = await requireAdminPermission("suscripciones", "edit");
  await togglePlanActive(planCode, isActive);
  await logAdminAction({
    adminId: session.user.id,
    action: "plan.toggleActive",
    targetTable: "Plan",
    targetId: planCode,
    changes: { after: { isActive } },
  });

  revalidatePath("/admin/suscripciones");
  return { success: true };
}

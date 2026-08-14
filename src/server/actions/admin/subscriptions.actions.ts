"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import { getUserForAdmin } from "@/server/data/admin/users";
import { getPlanByCode } from "@/server/data/payments";
import {
  adjustFeaturedVouchers,
  adjustPurchasedPublications,
  approveCashPayment,
  cancelSubscription,
  grantSubscription,
  togglePlanActive,
  updatePlan,
} from "@/server/data/admin/subscriptions";

export type UpdatePlanActionInput = {
  name: string;
  description: string;
  price: number;
  durationDays: number | null;
  quantity: number | null;
};

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
  revalidatePath("/dashboard/compra/historial");
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
  revalidatePath("/dashboard/compra/historial");
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
  revalidatePath("/dashboard/compra/historial");
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

export async function updatePlanAction(planCode: string, input: UpdatePlanActionInput): Promise<AdminActionState> {
  const session = await requireAdminPermission("suscripciones", "edit");
  const before = await getPlanByCode(planCode);
  if (!before) return { error: "Plan no encontrado." };

  const name = input.name.trim();
  if (name.length < 3) return { error: "El nombre es obligatorio (mínimo 3 caracteres)." };
  if (!Number.isFinite(input.price) || input.price <= 0) return { error: "Ingresá un precio válido." };
  if (input.durationDays !== null && (!Number.isInteger(input.durationDays) || input.durationDays <= 0)) {
    return { error: "La duración en días debe ser un número entero positivo, o dejarse vacía." };
  }
  if (input.quantity !== null && (!Number.isInteger(input.quantity) || input.quantity <= 0)) {
    return { error: "La cantidad debe ser un número entero positivo, o dejarse vacía." };
  }

  const after = await updatePlan(planCode, {
    name,
    description: input.description.trim() || null,
    price: input.price,
    durationDays: input.durationDays,
    quantity: input.quantity,
  });
  await logAdminAction({
    adminId: session.user.id,
    action: "plan.update",
    targetTable: "Plan",
    targetId: planCode,
    changes: {
      before: {
        name: before.name,
        description: before.description,
        price: Number(before.price),
        durationDays: before.durationDays,
        quantity: before.quantity,
      },
      after: {
        name: after.name,
        description: after.description,
        price: Number(after.price),
        durationDays: after.durationDays,
        quantity: after.quantity,
      },
    },
  });

  revalidatePath("/admin/suscripciones");
  revalidatePath("/dashboard/compra");
  return { success: true };
}

/** "Aprobar pago en efectivo": mueve un pago PENDING a APPROVED aplicando el mismo efecto que confirmaría Mercado Pago (ver `approveCashPayment`). Motivo obligatorio, queda en el registro de auditoría. */
export async function approveCashPaymentAction(paymentId: string, reason: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("suscripciones", "edit");
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 3) return { error: "Contanos el motivo del pago en efectivo." };

  let result;
  try {
    result = await approveCashPayment(paymentId, trimmedReason);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo aprobar el pago." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "payment.approveCash",
    targetTable: "Payment",
    targetId: paymentId,
    changes: {
      before: { status: result.before.status },
      after: { status: result.after.status, reason: trimmedReason },
    },
  });

  revalidatePath("/admin/suscripciones");
  revalidatePath("/dashboard/compra/historial");
  revalidatePath("/dashboard/anuncios");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { success: true };
}

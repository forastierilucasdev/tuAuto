import "server-only";
import { prisma } from "@/lib/prisma";
import type { PaymentStatus, Prisma } from "@/generated/prisma/client";

const ADMIN_PAYMENT_PAGE_SIZE = 25;

export type AdminPaymentFilters = {
  search?: string;
  status?: PaymentStatus;
  planCode?: string;
};

export async function listPaymentsForAdmin(filters: AdminPaymentFilters, page = 1) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const where: Prisma.PaymentWhereInput = {};

  if (filters.search) {
    where.user = {
      OR: [
        { email: { contains: filters.search, mode: "insensitive" } },
        { fullName: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }
  if (filters.status) where.status = filters.status;
  if (filters.planCode) where.planCode = filters.planCode;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ADMIN_PAYMENT_PAGE_SIZE,
      take: ADMIN_PAYMENT_PAGE_SIZE,
      include: { user: { select: { id: true, email: true, fullName: true } } },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_PAYMENT_PAGE_SIZE)),
  };
}

export async function listPlansForAdmin() {
  return prisma.plan.findMany({ orderBy: [{ isActive: "desc" }, { price: "asc" }] });
}

export async function togglePlanActive(planCode: string, isActive: boolean) {
  return prisma.plan.update({ where: { code: planCode }, data: { isActive } });
}

/**
 * "Asignar manualmente un plan premium"/"renovar membresía": mismo efecto
 * que `applySubscriptionEffect` en `server/data/payments.ts`, pero crea el
 * `Payment` directo en APPROVED (`provider: "admin"`, sin
 * `providerPaymentId`, la unique constraint permite null) — así queda
 * trazable en el propio historial de pagos del usuario, no es una mutación
 * silenciosa de cupo.
 */
export async function grantSubscription(userId: string, planCode: string, adminId: string) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { code: planCode } });
  if (!plan.quantity || !plan.durationDays) {
    throw new Error(`"${plan.name}" no es un plan de suscripción.`);
  }
  const subscriptionExpiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId,
        planCode: plan.code,
        amount: 0,
        status: "APPROVED",
        provider: "admin",
        description: `${plan.name} (otorgado manualmente)`,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { subscriptionQuota: plan.quantity, subscriptionExpiresAt },
    }),
  ]);

  return { planCode: plan.code, subscriptionQuota: plan.quantity, subscriptionExpiresAt, adminId };
}

/** "Cancelar suscripciones activas": vencimiento inmediato — mismo criterio perezoso que ya usa todo el cupo (`loadActivationContext`), sin agregar un estado "cancelada" nuevo. */
export async function cancelSubscription(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { subscriptionQuota: 0, subscriptionExpiresAt: new Date() },
  });
}

export async function adjustPurchasedPublications(userId: string, delta: number) {
  return prisma.user.update({ where: { id: userId }, data: { purchasedPublications: { increment: delta } } });
}

export async function adjustFeaturedVouchers(userId: string, delta: number) {
  return prisma.user.update({ where: { id: userId }, data: { pendingFeaturedVouchers: { increment: delta } } });
}

import "server-only";
import { prisma } from "@/lib/prisma";
import type { PaymentStatus, Prisma } from "@/generated/prisma/client";
import { applyPaymentEffect } from "@/server/data/payments";

const ADMIN_PAYMENT_PAGE_SIZE = 25;

export type AdminPaymentFilters = {
  search?: string;
  status?: PaymentStatus;
  planCode?: string;
};

function buildPaymentWhere(filters: AdminPaymentFilters): Prisma.PaymentWhereInput {
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

  return where;
}

export async function listPaymentsForAdmin(filters: AdminPaymentFilters, page = 1) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const where = buildPaymentWhere(filters);

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ADMIN_PAYMENT_PAGE_SIZE,
      take: ADMIN_PAYMENT_PAGE_SIZE,
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        listing: { select: { title: true } },
      },
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

/** Sin paginar — usado por la exportación CSV. */
export async function listAllPaymentsForAdmin(filters: AdminPaymentFilters) {
  return prisma.payment.findMany({
    where: buildPaymentWhere(filters),
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, email: true, fullName: true } } },
  });
}

export async function listPlansForAdmin() {
  return prisma.plan.findMany({ orderBy: [{ isActive: "desc" }, { price: "asc" }] });
}

export async function togglePlanActive(planCode: string, isActive: boolean) {
  return prisma.plan.update({ where: { code: planCode }, data: { isActive } });
}

export type UpdatePlanInput = {
  name: string;
  description: string | null;
  price: number;
  durationDays: number | null;
  quantity: number | null;
};

/** No toca `code` (rompería el vínculo con `Payment.planCode`, que es un string suelto sin FK) ni `isActive` (eso lo maneja `togglePlanActive`). El impacto es directo: `/dashboard/compra` lee `Plan` sin caché, y la próxima compra de este plan usa los valores nuevos. */
export async function updatePlan(planCode: string, data: UpdatePlanInput) {
  return prisma.plan.update({
    where: { code: planCode },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      durationDays: data.durationDays,
      quantity: data.quantity,
    },
  });
}

/**
 * "Aprobar pago en efectivo": reusa `applyPaymentEffect` (el mismo efecto
 * que aplica el webhook de Mercado Pago cuando confirma un pago) en vez de
 * solo cambiar `status` — así el pago realmente acredita cupo/suscripción/
 * destacado, no queda "aprobado" sin haber entregado lo que se pagó.
 * `providerPaymentId` sintético (único por `payment.id`) porque no hay uno
 * real de Mercado Pago en este caso.
 */
export async function approveCashPayment(paymentId: string, reason: string) {
  const before = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!before) throw new Error("Pago no encontrado.");
  if (before.status !== "PENDING") throw new Error("Solo se puede aprobar un pago pendiente.");

  await applyPaymentEffect(paymentId, `efectivo_${paymentId}`);
  const after = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      provider: "admin_cash",
      description: `${before.description} (pagado en efectivo, aprobado por administración)`,
    },
  });
  return { before, after, reason };
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

/**
 * Un ajuste positivo ("bonificar") queda trazable en el propio historial de
 * pagos del usuario (mismo criterio que `grantSubscription`) — uno
 * negativo (corregir un error) no genera una fila de "compra" falsa, sería
 * confuso mostrar un pago en $0 negativo.
 */
export async function adjustPurchasedPublications(userId: string, delta: number) {
  const updates: Prisma.PrismaPromise<unknown>[] = [
    prisma.user.update({ where: { id: userId }, data: { purchasedPublications: { increment: delta } } }),
  ];
  if (delta > 0) {
    updates.push(
      prisma.payment.create({
        data: {
          userId,
          planCode: "ADMIN_BONUS_PUBLICATIONS",
          amount: 0,
          status: "APPROVED",
          provider: "admin",
          description: `${delta} publicación${delta === 1 ? "" : "es"} bonificada${delta === 1 ? "" : "s"} (otorgado por el administrador)`,
        },
      })
    );
  }
  await prisma.$transaction(updates);
}

export async function adjustFeaturedVouchers(userId: string, delta: number) {
  const updates: Prisma.PrismaPromise<unknown>[] = [
    prisma.user.update({ where: { id: userId }, data: { pendingFeaturedVouchers: { increment: delta } } }),
  ];
  if (delta > 0) {
    updates.push(
      prisma.payment.create({
        data: {
          userId,
          planCode: "ADMIN_BONUS_FEATURED",
          amount: 0,
          status: "APPROVED",
          provider: "admin",
          description: `${delta} destacado${delta === 1 ? "" : "s"} bonificado${delta === 1 ? "" : "s"} (otorgado por el administrador)`,
        },
      })
    );
  }
  await prisma.$transaction(updates);
}

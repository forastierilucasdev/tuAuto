import "server-only";
import { prisma } from "@/lib/prisma";

export async function getActivePlans() {
  return prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
}

export async function getPlanByCode(code: string) {
  return prisma.plan.findUnique({ where: { code } });
}

export async function getPaymentMethods(userId: string) {
  return prisma.paymentMethod.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function addPaymentMethod(userId: string, label: string) {
  return prisma.paymentMethod.create({ data: { userId, label } });
}

export async function getPaymentHistory(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { title: true, slug: true } } },
  });
}

export async function getFeaturableListings(userId: string) {
  return prisma.listing.findMany({
    where: { userId, status: "ACTIVE", featured: false },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
}

const DEFAULT_FEATURE_DAYS = 15;

/**
 * Mock: aprueba el pago instantáneamente y aplica el efecto (destacar una
 * publicación). No hay integración real con Mercado Pago todavía — ver
 * ARCHITECTURE.md.
 */
export async function purchaseFeaturePlan(userId: string, planCode: string, listingId: string) {
  const [plan, listing] = await Promise.all([
    prisma.plan.findUnique({ where: { code: planCode } }),
    prisma.listing.findFirst({ where: { id: listingId, userId, status: "ACTIVE" } }),
  ]);
  if (!plan || !listing) throw new Error("Plan o publicación inválidos.");

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId,
        listingId: listing.id,
        planCode: plan.code,
        amount: plan.price,
        status: "APPROVED",
        description: `${plan.name} — ${listing.title}`,
      },
    }),
    prisma.listing.update({
      where: { id: listing.id },
      data: {
        featured: true,
        featuredUntil: new Date(Date.now() + (plan.durationDays ?? DEFAULT_FEATURE_DAYS) * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
}

export async function purchaseSubscription(userId: string, planCode: string) {
  const plan = await prisma.plan.findUnique({ where: { code: planCode } });
  if (!plan) throw new Error("Plan inválido.");

  await prisma.payment.create({
    data: {
      userId,
      planCode: plan.code,
      amount: plan.price,
      status: "APPROVED",
      description: plan.name,
    },
  });
}

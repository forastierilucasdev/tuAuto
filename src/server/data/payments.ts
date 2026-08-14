import "server-only";
import { prisma } from "@/lib/prisma";
import { daysRemaining } from "@/lib/utils";
import { createMercadoPagoPreference } from "@/lib/mercadopago";
import type { Payment as PaymentModel, Plan as PlanModel, Prisma } from "@/generated/prisma/client";
import {
  FEATURED_VOUCHER_DAYS,
  getEffectiveFeatured,
  getListingForFeatureCheck,
  loadActivationContext,
} from "@/server/data/listings";

export async function getActivePlans() {
  return prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
}

export async function getPlanByCode(code: string) {
  return prisma.plan.findUnique({ where: { code } });
}

/** Usado solo por el webhook de Mercado Pago para resolver `external_reference` (= `Payment.id`). */
export async function getPaymentById(id: string) {
  return prisma.payment.findUnique({ where: { id } });
}

export async function getPaymentHistory(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { title: true, slug: true } } },
  });
}

/**
 * Crea el `Payment` en estado PENDING y la preferencia de Checkout Pro —
 * nada se acredita acá. El efecto real (sumar cupo, destacar, etc.) lo
 * aplica `applyPaymentEffect`, invocada solo desde el webhook cuando
 * Mercado Pago confirma el pago de verdad.
 */
export async function purchasePublicationPack(userId: string, planCode: string): Promise<string> {
  const plan = await prisma.plan.findUnique({ where: { code: planCode } });
  if (!plan || !plan.quantity) throw new Error("Pack inválido.");

  const payment = await prisma.payment.create({
    data: { userId, planCode: plan.code, amount: plan.price, status: "PENDING", description: plan.name },
  });

  return createMercadoPagoPreference({
    items: [{ id: plan.code, title: plan.name, unitPrice: Number(plan.price) }],
    externalReference: payment.id,
  });
}

export async function getPublicationPackPlans() {
  return prisma.plan.findMany({
    where: { isActive: true, code: { startsWith: "PUBLICATIONS_PACK_" } },
    orderBy: { price: "asc" },
  });
}

/**
 * Suscripción (5/10/30 publicaciones por 30 días): a diferencia de un pack,
 * escribe (no suma) `subscriptionQuota`/`subscriptionExpiresAt` — comprar una
 * nueva reemplaza la anterior, no se apilan. El cupo se pierde solo si vence
 * sin renovarse (ver `loadActivationContext` en `server/data/listings.ts`).
 * Igual que el pack: solo crea el `Payment` PENDING + la preferencia.
 */
export async function purchaseSubscription(userId: string, planCode: string): Promise<string> {
  const plan = await prisma.plan.findUnique({ where: { code: planCode } });
  if (!plan || !plan.quantity || !plan.durationDays) throw new Error("Plan inválido.");

  const payment = await prisma.payment.create({
    data: { userId, planCode: plan.code, amount: plan.price, status: "PENDING", description: plan.name },
  });

  return createMercadoPagoPreference({
    items: [{ id: plan.code, title: plan.name, unitPrice: Number(plan.price) }],
    externalReference: payment.id,
  });
}

export async function getSubscriptionPlans() {
  return prisma.plan.findMany({
    where: { isActive: true, code: { startsWith: "SUBSCRIPTION_" } },
    orderBy: { price: "asc" },
  });
}

export async function getSubscriptionStatus(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { subscriptionQuota: true, subscriptionExpiresAt: true },
  });
  const active = Boolean(user.subscriptionExpiresAt && user.subscriptionExpiresAt.getTime() > Date.now());
  return { active, quota: active ? user.subscriptionQuota : 0, expiresAt: user.subscriptionExpiresAt };
}

/** "Destacados disponibles" en Resumen/Mis compras — distinto de "Publicaciones destacadas" (avisos ya destacados hoy). */
export async function getPendingFeaturedVouchers(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { pendingFeaturedVouchers: true } });
  return user.pendingFeaturedVouchers;
}

const FEATURE_PER_DAY_PLAN_CODE = "FEATURE_PER_DAY";
// Tope defensivo del carrito: nadie tiene, en la práctica, más publicaciones
// que el máximo de una suscripción (30) — sin este límite, un array
// arbitrariamente grande dispararía una query por línea más una transacción
// gigante (DoS contra la base).
const MAX_FEATURE_CART_ITEMS = 30;

type FeatureByDaysItem = { listingId: string; title: string; appliedDays: number };
type FeatureByDaysMetadata = { items: FeatureByDaysItem[] };
type FeatureComboMetadata = { choice: { listingId: string } | { forNextListing: true } };

/**
 * "Destacar publicación por día": una compra puede cubrir varias
 * publicaciones a la vez (carrito). Cada línea se valida server-side
 * (propiedad, activa, no destacada, días recortados a lo que le queda de
 * vigencia) — si una sola línea no es válida se rechaza el lote completo
 * (no se cobra parcial). Un solo `Payment` PENDING para todo el carrito
 * (una preferencia de Mercado Pago = un solo pago, aunque tenga varios
 * `items`), con las líneas resueltas guardadas en `metadata` para que el
 * webhook sepa qué aplicar cuando se confirme.
 */
export async function purchaseFeatureByDays(userId: string, items: { listingId: string; days: number }[]): Promise<string> {
  if (items.length === 0) throw new Error("No seleccionaste ninguna publicación.");
  if (items.length > MAX_FEATURE_CART_ITEMS) {
    throw new Error(`Podés destacar como máximo ${MAX_FEATURE_CART_ITEMS} publicaciones por compra.`);
  }
  // Si el mismo aviso aparece más de una vez, se queda con la última línea
  // en vez de cobrarlo/aplicarlo dos veces.
  const dedupedItems = [...new Map(items.map((item) => [item.listingId, item])).values()];

  const plan = await prisma.plan.findUnique({ where: { code: FEATURE_PER_DAY_PLAN_CODE } });
  if (!plan) throw new Error("Plan inválido.");
  const pricePerDay = Number(plan.price);

  const resolved: FeatureByDaysItem[] = await Promise.all(
    dedupedItems.map(async ({ listingId, days }) => {
      const listing = await getListingForFeatureCheck(listingId, userId);
      if (!listing) throw new Error("Una de las publicaciones seleccionadas no existe o no te pertenece.");
      if (listing.status !== "ACTIVE") throw new Error(`"${listing.title}" no está activa.`);
      if (getEffectiveFeatured(listing.featured, listing.featuredUntil)) {
        throw new Error(`"${listing.title}" ya está destacada.`);
      }
      const maxDays = daysRemaining(listing.expiresAt);
      const appliedDays = Math.min(Math.max(1, Math.trunc(days)), maxDays);
      if (appliedDays < 1) throw new Error(`"${listing.title}" no tiene días disponibles para destacar.`);
      return { listingId: listing.id, title: listing.title, appliedDays };
    })
  );

  const totalAmount = resolved.reduce((sum, { appliedDays }) => sum + pricePerDay * appliedDays, 0);
  const metadata: FeatureByDaysMetadata = { items: resolved };

  const payment = await prisma.payment.create({
    data: {
      userId,
      planCode: plan.code,
      amount: totalAmount,
      status: "PENDING",
      description: `${plan.name} — ${resolved.map((r) => `${r.title} (${r.appliedDays}d)`).join(", ")}`,
      metadata,
    },
  });

  return createMercadoPagoPreference({
    items: resolved.map((r) => ({
      id: r.listingId,
      title: `${plan.name} — ${r.title} (${r.appliedDays} día${r.appliedDays === 1 ? "" : "s"})`,
      unitPrice: pricePerDay * r.appliedDays,
    })),
    externalReference: payment.id,
  });
}

const FEATURE_COMBO_PLAN_CODE = "PUBLICATION_30D_FEATURED_7D";

/**
 * "Publicación 30 días + 7 días destacado": dos formas de aplicarlo, a
 * elección del usuario en el wizard (se guarda en `metadata.choice`, el
 * webhook la lee recién al confirmar el pago).
 * - `{ listingId }`: boost directo sobre una publicación propia ya activa —
 *   renueva su vencimiento (respeta una suscripción activa, si hay) y la
 *   destaca 7 días. No toca cupo/publicaciones realizadas: es un pago
 *   directo sobre ese aviso, no una publicación nueva.
 * - `{ forNextListing: true }`: guarda el beneficio para más adelante — suma
 *   1 a `purchasedPublications` (permanente, como un pack) y 1 voucher de
 *   destacado pendiente, que se aplican solos en la próxima publicación o
 *   reactivación (ver `loadActivationContext`).
 */
export async function purchaseFeatureCombo(
  userId: string,
  choice: { listingId: string } | { forNextListing: true }
): Promise<string> {
  const plan = await prisma.plan.findUnique({ where: { code: FEATURE_COMBO_PLAN_CODE } });
  if (!plan) throw new Error("Plan inválido.");

  let description = `${plan.name} — próxima publicación`;
  if ("listingId" in choice) {
    const listing = await getListingForFeatureCheck(choice.listingId, userId);
    if (!listing) throw new Error("La publicación seleccionada no existe o no te pertenece.");
    if (listing.status !== "ACTIVE") throw new Error("Solo se puede aplicar a una publicación activa.");
    if (getEffectiveFeatured(listing.featured, listing.featuredUntil)) {
      throw new Error("Esta publicación ya está destacada.");
    }
    description = `${plan.name} — ${listing.title}`;
  }

  const metadata: FeatureComboMetadata = { choice };
  const payment = await prisma.payment.create({
    data: {
      userId,
      listingId: "listingId" in choice ? choice.listingId : undefined,
      planCode: plan.code,
      amount: plan.price,
      status: "PENDING",
      description,
      metadata,
    },
  });

  return createMercadoPagoPreference({
    items: [{ id: plan.code, title: description, unitPrice: Number(plan.price) }],
    externalReference: payment.id,
  });
}

/**
 * Aplica el efecto de un pago recién confirmado por Mercado Pago (llamado
 * solo desde el webhook). Idempotente: si el `Payment` ya no está PENDING
 * (webhook duplicado, ya procesado) no hace nada.
 */
export async function applyPaymentEffect(paymentId: string, providerPaymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return;

  const plan = await prisma.plan.findUnique({ where: { code: payment.planCode } });
  if (!plan) throw new Error(`Plan "${payment.planCode}" no encontrado al aplicar el pago ${payment.id}.`);

  if (payment.planCode === FEATURE_PER_DAY_PLAN_CODE) {
    await applyFeatureByDaysEffect(payment, providerPaymentId);
  } else if (payment.planCode === FEATURE_COMBO_PLAN_CODE) {
    await applyFeatureComboEffect(payment, providerPaymentId);
  } else if (plan.quantity && plan.durationDays) {
    await applySubscriptionEffect(payment, plan, providerPaymentId);
  } else if (plan.quantity) {
    await applyPublicationPackEffect(payment, plan, providerPaymentId);
  } else {
    throw new Error(`No hay un efecto definido para el plan "${payment.planCode}".`);
  }
}

async function applyPublicationPackEffect(payment: PaymentModel, plan: PlanModel, providerPaymentId: string) {
  await prisma.$transaction([
    prisma.payment.update({ where: { id: payment.id }, data: { status: "APPROVED", providerPaymentId } }),
    prisma.user.update({
      where: { id: payment.userId },
      data: { purchasedPublications: { increment: plan.quantity! } },
    }),
  ]);
}

async function applySubscriptionEffect(payment: PaymentModel, plan: PlanModel, providerPaymentId: string) {
  await prisma.$transaction([
    prisma.payment.update({ where: { id: payment.id }, data: { status: "APPROVED", providerPaymentId } }),
    prisma.user.update({
      where: { id: payment.userId },
      data: {
        subscriptionQuota: plan.quantity!,
        subscriptionExpiresAt: new Date(Date.now() + plan.durationDays! * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
}

async function applyFeatureByDaysEffect(payment: PaymentModel, providerPaymentId: string) {
  const metadata = payment.metadata as unknown as FeatureByDaysMetadata | null;
  const updates: Prisma.PrismaPromise<unknown>[] = [
    prisma.payment.update({ where: { id: payment.id }, data: { status: "APPROVED", providerPaymentId } }),
  ];

  for (const { listingId, appliedDays } of metadata?.items ?? []) {
    const listing = await getListingForFeatureCheck(listingId, payment.userId);
    // Puede haber dejado de ser elegible entre que se inició el pago y se
    // confirmó (se vendió, venció) — se saltea esa línea nada más. Caso raro
    // (ventana de minutos); no hay reembolso automático hoy.
    if (!listing || listing.status !== "ACTIVE" || getEffectiveFeatured(listing.featured, listing.featuredUntil)) {
      console.warn(
        `[mercadopago] Pago ${payment.id}: la publicación ${listingId} ya no es elegible para destacar, se saltea.`
      );
      continue;
    }
    updates.push(
      prisma.listing.update({
        where: { id: listingId },
        data: {
          featured: true,
          featuredSince: new Date(),
          featuredUntil: new Date(Date.now() + appliedDays * 24 * 60 * 60 * 1000),
        },
      })
    );
  }

  await prisma.$transaction(updates);
}

async function applyFeatureComboEffect(payment: PaymentModel, providerPaymentId: string) {
  const metadata = payment.metadata as unknown as FeatureComboMetadata | null;
  const choice = metadata?.choice;
  if (!choice) throw new Error(`Pago ${payment.id} (combo) sin metadata de elección.`);

  if ("forNextListing" in choice) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "APPROVED", providerPaymentId } }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { purchasedPublications: { increment: 1 }, pendingFeaturedVouchers: { increment: 1 } },
      }),
    ]);
    return;
  }

  const listing = await getListingForFeatureCheck(choice.listingId, payment.userId);
  if (!listing || listing.status !== "ACTIVE" || getEffectiveFeatured(listing.featured, listing.featuredUntil)) {
    console.warn(
      `[mercadopago] Pago ${payment.id}: la publicación ${choice.listingId} ya no es elegible para el combo, se aprueba el pago sin destacar.`
    );
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "APPROVED", providerPaymentId } });
    return;
  }

  const activation = await loadActivationContext(payment.userId);
  await prisma.$transaction([
    prisma.payment.update({ where: { id: payment.id }, data: { status: "APPROVED", providerPaymentId } }),
    prisma.listing.update({
      where: { id: listing.id },
      data: {
        expiresAt: activation.expiresAt,
        featured: true,
        featuredSince: new Date(),
        featuredUntil: new Date(Date.now() + FEATURED_VOUCHER_DAYS * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
}

/** Marca un pago como rechazado (Mercado Pago devolvió `status: "rejected"`) — sin efecto, idempotente. */
export async function markPaymentRejected(paymentId: string, providerPaymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return;
  await prisma.payment.update({ where: { id: paymentId }, data: { status: "REJECTED", providerPaymentId } });
}

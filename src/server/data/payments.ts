import "server-only";
import { prisma } from "@/lib/prisma";
import { daysRemaining } from "@/lib/utils";
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

/**
 * Mock: aprueba el pago instantáneamente y suma las publicaciones del pack
 * al cupo disponible del usuario (`purchasedPublications`, permanente). No
 * hay integración real con Mercado Pago todavía — ver ARCHITECTURE.md.
 */
export async function purchasePublicationPack(userId: string, planCode: string) {
  const plan = await prisma.plan.findUnique({ where: { code: planCode } });
  if (!plan || !plan.quantity) throw new Error("Pack inválido.");

  await prisma.$transaction([
    prisma.payment.create({
      data: { userId, planCode: plan.code, amount: plan.price, status: "APPROVED", description: plan.name },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { purchasedPublications: { increment: plan.quantity } },
    }),
  ]);
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
 */
export async function purchaseSubscription(userId: string, planCode: string) {
  const plan = await prisma.plan.findUnique({ where: { code: planCode } });
  if (!plan || !plan.quantity || !plan.durationDays) throw new Error("Plan inválido.");

  await prisma.$transaction([
    prisma.payment.create({
      data: { userId, planCode: plan.code, amount: plan.price, status: "APPROVED", description: plan.name },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionQuota: plan.quantity,
        subscriptionExpiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
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

/**
 * "Destacar publicación por día": una compra puede cubrir varias
 * publicaciones a la vez (carrito). Cada línea se valida server-side
 * (propiedad, activa, no destacada, días recortados a lo que le queda de
 * vigencia) — si una sola línea no es válida se rechaza el lote completo
 * (no se cobra parcial). Una sola `$transaction` con un `Payment` + un
 * `Listing.update` por línea.
 */
export async function purchaseFeatureByDays(userId: string, items: { listingId: string; days: number }[]) {
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

  const resolved = await Promise.all(
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

  await prisma.$transaction(
    resolved.flatMap(({ listingId, title, appliedDays }) => [
      prisma.payment.create({
        data: {
          userId,
          listingId,
          planCode: plan.code,
          amount: pricePerDay * appliedDays,
          status: "APPROVED",
          description: `${plan.name} — ${title} — ${appliedDays} día${appliedDays === 1 ? "" : "s"}`,
        },
      }),
      prisma.listing.update({
        where: { id: listingId },
        data: { featured: true, featuredUntil: new Date(Date.now() + appliedDays * 24 * 60 * 60 * 1000) },
      }),
    ])
  );
}

const FEATURE_COMBO_PLAN_CODE = "PUBLICATION_30D_FEATURED_7D";

/**
 * "Publicación 30 días + 7 días destacado": dos formas de aplicarlo, a
 * elección del usuario en el wizard.
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
) {
  const plan = await prisma.plan.findUnique({ where: { code: FEATURE_COMBO_PLAN_CODE } });
  if (!plan) throw new Error("Plan inválido.");

  if ("forNextListing" in choice) {
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          userId,
          planCode: plan.code,
          amount: plan.price,
          status: "APPROVED",
          description: `${plan.name} — próxima publicación`,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { purchasedPublications: { increment: 1 }, pendingFeaturedVouchers: { increment: 1 } },
      }),
    ]);
    return;
  }

  const listing = await getListingForFeatureCheck(choice.listingId, userId);
  if (!listing) throw new Error("La publicación seleccionada no existe o no te pertenece.");
  if (listing.status !== "ACTIVE") throw new Error("Solo se puede aplicar a una publicación activa.");
  if (getEffectiveFeatured(listing.featured, listing.featuredUntil)) {
    throw new Error("Esta publicación ya está destacada.");
  }

  const activation = await loadActivationContext(userId);
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
        expiresAt: activation.expiresAt,
        featured: true,
        featuredUntil: new Date(Date.now() + FEATURED_VOUCHER_DAYS * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
}

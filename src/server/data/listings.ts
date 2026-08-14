import "server-only";
import { prisma } from "@/lib/prisma";
import type { AccountType, Currency, ListingStatus, Prisma, VehicleCondition, VehicleType } from "@/generated/prisma/client";
import type { VehicleCardData } from "@/types/vehicle";
import { FALLBACK_IMAGE } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export type CatalogFilters = {
  vehicleType?: VehicleType;
  brandSlug?: string;
  modelSlug?: string;
  year?: number;
  condition?: VehicleCondition;
  currency?: Currency;
  minPrice?: number;
  maxPrice?: number;
  minKm?: number;
  maxKm?: number;
  sellerAccountType?: AccountType;
  province?: string;
  city?: string;
};

const CARD_INCLUDE = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
  user: { select: { accountType: true } },
} satisfies Prisma.ListingInclude;

type ListingWithCardData = Prisma.ListingGetPayload<{ include: typeof CARD_INCLUDE }>;

export function toVehicleCardData(listing: ListingWithCardData): VehicleCardData {
  return {
    slug: listing.slug,
    title: listing.title,
    price: Number(listing.price),
    currency: listing.currency,
    year: listing.year,
    mileageKm: listing.mileageKm,
    imageUrl: listing.images[0]?.url ?? FALLBACK_IMAGE,
    featured: getEffectiveFeatured(listing.featured, listing.featuredUntil),
    vehicleType: listing.vehicleType,
    condition: listing.condition,
    city: listing.city,
    province: listing.province,
    sellerAccountType: listing.user.accountType,
  };
}

// Un anuncio "reservado" se sigue mostrando en el catálogo (el vendedor lo
// marcó así para indicar que está en proceso de venta); "pausado" es lo
// único que se oculta manualmente además de vencido/vendido.
const PUBLICLY_VISIBLE_STATUSES = ["ACTIVE", "RESERVADA"] as const;

// Estados a los que les corre el plazo de publicación (30 días desde que se
// publicó por última vez): al vencer, se tratan como "Vencida" aunque en la
// base sigan con este status — no hay ningún proceso en segundo plano que
// los reescriba, se calcula al leer (ver `getEffectiveStatus`).
const EXPIRABLE_STATUSES: ListingStatus[] = ["ACTIVE", "RESERVADA", "PAUSADA"];

// Suspensión de ESTA publicación puntual (admin, con motivo) — distinta de
// que el DUEÑO esté suspendido (eso se resuelve aparte, ver
// `visibleStatusWhere()` más abajo). 100% computado, nunca se reescribe
// `status` — mismo criterio que ya usa EXPIRED, se chequea primero porque
// una suspensión pisa cualquier otro estado mientras está vigente.
function getEffectiveStatus(status: ListingStatus, expiresAt: Date | null, suspendedUntil?: Date | null): ListingStatus {
  if (suspendedUntil && suspendedUntil.getTime() > Date.now()) return "SUSPENDIDA";
  if (EXPIRABLE_STATUSES.includes(status) && expiresAt && expiresAt.getTime() < Date.now()) {
    return "EXPIRED";
  }
  return status;
}

// No vencido = sin fecha límite todavía, o la fecha límite no pasó.
function notExpiredWhere(): Prisma.ListingWhereInput {
  return { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] };
}

/**
 * Todo dentro de un único `AND` (no una clave `OR` suelta) a propósito:
 * `getCatalogResults` combina esto con `effectivelyFeaturedWhere()` vía
 * `{...visibleStatusWhere(), ...effectivelyFeaturedWhere(...)}` — si acá
 * hubiera una clave `OR` de nivel superior, esa combinación la pisaría por
 * completo con el `OR` de destacados (mismo nombre de clave, gana el
 * último spread), perdiendo el filtro de estado/vencimiento/suspensión sin
 * ningún error visible. Con todo adentro de `AND`, nunca colisiona con
 * ninguna otra clave que se le sume después.
 */
function visibleStatusWhere(): Prisma.ListingWhereInput {
  return {
    deletedAt: null,
    AND: [
      { OR: PUBLICLY_VISIBLE_STATUSES.map((status) => ({ status, ...notExpiredWhere() })) },
      // Ni la publicación ni el dueño están suspendidos ahora mismo — dos
      // mecanismos distintos (una publicación puntual, o la cuenta entera)
      // que igual ocultan del catálogo público mientras duran.
      { OR: [{ suspendedUntil: null }, { suspendedUntil: { lte: new Date() } }] },
      { user: { OR: [{ suspendedUntil: null }, { suspendedUntil: { lte: new Date() } }] } },
    ],
  };
}

// `featured` se pone en `true` al comprar un destacado (por N días,
// `featuredUntil`), pero nada lo vuelve a poner en `false` solo — se calcula
// al leer, mismo criterio que `getEffectiveStatus`.
export function getEffectiveFeatured(featured: boolean, featuredUntil: Date | null): boolean {
  if (!featured) return false;
  if (featuredUntil && featuredUntil.getTime() < Date.now()) return false;
  return true;
}

function effectivelyFeaturedWhere(featured: boolean): Prisma.ListingWhereInput {
  return featured
    ? { featured: true, OR: [{ featuredUntil: null }, { featuredUntil: { gt: new Date() } }] }
    : { OR: [{ featured: false }, { featuredUntil: { lte: new Date() } }] };
}

function buildWhere(filters: CatalogFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = visibleStatusWhere();

  if (filters.vehicleType) where.vehicleType = filters.vehicleType;
  if (filters.brandSlug) where.brand = { slug: filters.brandSlug };
  if (filters.modelSlug) where.model = { slug: filters.modelSlug };
  if (filters.year) where.year = filters.year;
  if (filters.condition) where.condition = filters.condition;
  if (filters.sellerAccountType) where.user = { accountType: filters.sellerAccountType };
  if (filters.province) where.province = filters.province;
  // Localidad: la escribe el usuario libremente (al publicar y al buscar),
  // así que es "contains" sin distinguir mayúsculas — un match exacto
  // fallaría por cualquier diferencia mínima de tipeo.
  if (filters.city) where.city = { contains: filters.city, mode: "insensitive" };

  if (filters.minKm !== undefined || filters.maxKm !== undefined) {
    where.mileageKm = {
      ...(filters.minKm !== undefined ? { gte: filters.minKm } : {}),
      ...(filters.maxKm !== undefined ? { lte: filters.maxKm } : {}),
    };
  }

  // El precio se filtra dentro de una única moneda a la vez (ARS por defecto):
  // combinar ARS y USD en un mismo rango numérico daría resultados sin
  // sentido sin una tasa de conversión real. Ver ERRORES.md.
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.currency = filters.currency ?? "ARS";
    where.price = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
    };
  } else if (filters.currency) {
    where.currency = filters.currency;
  }

  return where;
}

// Destacados: cupo pago, en la práctica siempre son pocos — se muestran
// todos de una (capados igual, por las dudas) sin paginar aparte.
const FEATURED_CATALOG_LIMIT = 12;
// "Resto del catálogo" sí crece sin límite con el uso real de la app — es
// además la única query del catálogo alcanzable sin sesión, así que sin
// paginar era un vector de DoS de solo lectura (trae todos los resultados
// completos, con joins, en cada visita/filtro).
const CATALOG_PAGE_SIZE = 24;

export async function getCatalogResults(filters: CatalogFilters, page = 1) {
  const baseWhere = buildWhere(filters);
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const restWhere = { ...baseWhere, ...effectivelyFeaturedWhere(false) };

  const [featured, rest, restTotal] = await Promise.all([
    prisma.listing.findMany({
      where: { ...baseWhere, ...effectivelyFeaturedWhere(true) },
      orderBy: { createdAt: "desc" },
      take: FEATURED_CATALOG_LIMIT,
      include: CARD_INCLUDE,
    }),
    prisma.listing.findMany({
      where: restWhere,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
      include: CARD_INCLUDE,
    }),
    prisma.listing.count({ where: restWhere }),
  ]);

  return {
    featured: featured.map(toVehicleCardData),
    rest: rest.map(toVehicleCardData),
    restTotal,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(restTotal / CATALOG_PAGE_SIZE)),
  };
}

export async function getFeaturedListings(limit = 3) {
  const listings = await prisma.listing.findMany({
    where: { ...visibleStatusWhere(), ...effectivelyFeaturedWhere(true) },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: CARD_INCLUDE,
  });
  return listings.map(toVehicleCardData);
}

/**
 * El dueño puede abrir su propia publicación en cualquier estado (borrador,
 * pausada, vencida, vendida) desde "Mis publicaciones" — para cualquier
 * otro visitante se aplica el filtro de visibilidad pública normal.
 */
export async function getListingBySlug(slug: string, viewerUserId?: string) {
  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      brand: true,
      model: true,
      user: {
        select: {
          fullName: true,
          phone: true,
          accountType: true,
          avatarUrl: true,
          isVerified: true,
          suspendedUntil: true,
          agencyProfile: { select: { businessName: true, city: true, province: true, address: true, logoUrl: true } },
        },
      },
    },
  });
  // Dado de baja por un admin — invisible para cualquiera, incluido el
  // dueño (que puede seguir viéndola en su panel, pero no operarla
  // normalmente ni que aparezca en el detalle público).
  if (!listing || listing.deletedAt) return null;

  const isOwner = viewerUserId && listing.userId === viewerUserId;
  if (isOwner) return listing;

  const effectiveStatus = getEffectiveStatus(listing.status, listing.expiresAt, listing.suspendedUntil);
  const isVisible = PUBLICLY_VISIBLE_STATUSES.includes(
    effectiveStatus as (typeof PUBLICLY_VISIBLE_STATUSES)[number]
  );
  const ownerSuspended = Boolean(listing.user.suspendedUntil && listing.user.suspendedUntil.getTime() > Date.now());
  return isVisible && !ownerSuspended ? listing : null;
}

/** Mismo criterio de visibilidad que `getActiveListingsByUser` — usado para el contador de la tarjeta de concesionaria. */
export async function getVisibleListingCountByUser(userId: string) {
  return prisma.listing.count({ where: { userId, ...visibleStatusWhere() } });
}

export async function getActiveListingsByUser(userId: string) {
  const listings = await prisma.listing.findMany({
    where: { userId, ...visibleStatusWhere() },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: CARD_INCLUDE,
  });
  return listings.map(toVehicleCardData);
}

export type OwnerListingData = VehicleCardData & {
  id: string;
  status: ListingStatus;
  createdAt: Date;
  publishedAt: Date | null;
  expiresAt: Date | null;
  soldAt: Date | null;
  realSalePrice: number | null;
  // Vistas reales (deduplicadas por visitante/día, ver `lib/listing-views.ts`)
  // — dato privado, solo visible acá (panel del dueño), nunca en la
  // publicación pública.
  viewCount: number;
  // Suspensión de esta publicación puntual (admin, con motivo) — solo
  // tienen valor cuando `status` efectivo es "SUSPENDIDA".
  suspendedUntil: Date | null;
  suspensionReason: string | null;
};

function toOwnerListingData(listing: ListingWithCardData): OwnerListingData {
  return {
    ...toVehicleCardData(listing),
    id: listing.id,
    status: getEffectiveStatus(listing.status, listing.expiresAt, listing.suspendedUntil),
    createdAt: listing.createdAt,
    publishedAt: listing.publishedAt,
    expiresAt: listing.expiresAt,
    soldAt: listing.soldAt,
    realSalePrice: listing.realSalePrice ? Number(listing.realSalePrice) : null,
    viewCount: listing.viewCount,
    suspendedUntil: listing.suspendedUntil,
    suspensionReason: listing.suspensionReason,
  };
}

export async function getOwnerListingGroups(userId: string) {
  const listings = await prisma.listing.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: CARD_INCLUDE,
  });

  const withEffectiveStatus = listings.map((l) => ({
    listing: l,
    status: getEffectiveStatus(l.status, l.expiresAt, l.suspendedUntil),
  }));

  return {
    destacadas: withEffectiveStatus
      .filter((l) => l.status === "ACTIVE" && getEffectiveFeatured(l.listing.featured, l.listing.featuredUntil))
      .map((l) => toOwnerListingData(l.listing)),
    activas: withEffectiveStatus
      .filter((l) => l.status === "ACTIVE" && !getEffectiveFeatured(l.listing.featured, l.listing.featuredUntil))
      .map((l) => toOwnerListingData(l.listing)),
    reservadas: withEffectiveStatus.filter((l) => l.status === "RESERVADA").map((l) => toOwnerListingData(l.listing)),
    // Borrador, pausada, vencida y suspendida: en las cuatro se dejó de
    // operar el anuncio con normalidad. El badge de cada card indica el
    // estado real y las acciones disponibles varían según corresponda (ver
    // OwnerListingCard).
    inactivas: withEffectiveStatus
      .filter((l) => l.status === "DRAFT" || l.status === "PAUSADA" || l.status === "EXPIRED" || l.status === "SUSPENDIDA")
      .map((l) => toOwnerListingData(l.listing)),
    vendidas: withEffectiveStatus.filter((l) => l.status === "SOLD").map((l) => toOwnerListingData(l.listing)),
  };
}

const LISTING_DURATION_DAYS = 30;

// Días que otorga un voucher de "destacar" pendiente (comprado como
// "Publicación 30 días + 7 días destacado", aplicado a la próxima
// publicación/reactivación en vez de a una publicación existente) — también
// usado cuando ese mismo combo se aplica directo a una publicación existente
// (ver `purchaseFeatureCombo` en `server/data/payments.ts`).
export const FEATURED_VOUCHER_DAYS = 7;

// Cupo gratuito de publicaciones por cuenta. El disponible es
// FREE_PUBLICATION_QUOTA + purchasedPublications + cupoDeSuscripciónVigente -
// quotaConsumed (ver modelo User en schema.prisma). Comprar un pack suma a
// `purchasedPublications` (permanente); comprar una suscripción reemplaza
// `subscriptionQuota`/`subscriptionExpiresAt` (temporal, se pierde al vencer).
export const FREE_PUBLICATION_QUOTA = 10;

export class QuotaExceededError extends Error {
  constructor() {
    super("No te quedan publicaciones disponibles. Comprá un pack o una suscripción para seguir publicando.");
    this.name = "QuotaExceededError";
  }
}

export class AccountSuspendedError extends Error {
  constructor() {
    super("Tu cuenta está suspendida — no podés publicar ni reactivar publicaciones mientras dure.");
    this.name = "AccountSuspendedError";
  }
}

/**
 * Punto único que decide, para cualquier publicación/reactivación: cuántas
 * publicaciones quedan disponibles, hasta cuándo va a vencer (el ciclo normal
 * de 30 días, o la fecha de la suscripción activa si hay una — así todos los
 * avisos de una suscripción vencen juntos), si hay un voucher de destacado
 * pendiente para aplicar, y si la cuenta está suspendida (`isSuspended` —
 * no tira acá: esta función también la usa `getAvailablePublications`, de
 * solo lectura, que no debería romperse para una cuenta suspendida; cada
 * mutación real chequea `isSuspended` y tira `AccountSuspendedError` ella
 * misma). Se consulta una sola vez por operación — evita que distintas
 * funciones calculen estos números con criterios distintos.
 */
export async function loadActivationContext(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      quotaConsumed: true,
      purchasedPublications: true,
      subscriptionQuota: true,
      subscriptionExpiresAt: true,
      pendingFeaturedVouchers: true,
      suspendedUntil: true,
    },
  });
  const now = Date.now();
  const hasActiveSubscription = Boolean(user.subscriptionExpiresAt && user.subscriptionExpiresAt.getTime() > now);
  const effectiveSubscriptionQuota = hasActiveSubscription ? user.subscriptionQuota : 0;

  return {
    available: Math.max(
      0,
      FREE_PUBLICATION_QUOTA + user.purchasedPublications + effectiveSubscriptionQuota - user.quotaConsumed
    ),
    expiresAt: hasActiveSubscription
      ? user.subscriptionExpiresAt!
      : new Date(now + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000),
    useFeaturedVoucher: user.pendingFeaturedVouchers > 0,
    isSuspended: Boolean(user.suspendedUntil && user.suspendedUntil.getTime() > now),
  };
}

export async function getAvailablePublications(userId: string) {
  return (await loadActivationContext(userId)).available;
}

function assertAvailable(available: number) {
  if (available <= 0) throw new QuotaExceededError();
}

function assertNotSuspended(isSuspended: boolean) {
  if (isSuspended) throw new AccountSuspendedError();
}

/**
 * Qué implica reactivar desde cada estado:
 * - Reservada/Pausada: sigue el mismo ciclo de publicación en curso, es
 *   gratis (no consume cupo) y no cuenta como una publicación nueva.
 * - Vencida: el plazo ya corrió — reactivarla arranca un ciclo nuevo, así
 *   que sí consume cupo, pero sigue siendo la MISMA publicación (no suma a
 *   "publicaciones realizadas" otra vez).
 * - Borrador: nunca se publicó — es la primera publicación de verdad, así
 *   que consume cupo Y cuenta como una publicación nueva.
 */
function getReactivationCost(status: ListingStatus): { countsAsNewListing: boolean; consumesQuota: boolean } {
  if (status === "DRAFT") return { countsAsNewListing: true, consumesQuota: true };
  if (status === "EXPIRED") return { countsAsNewListing: false, consumesQuota: true };
  return { countsAsNewListing: false, consumesQuota: false }; // RESERVADA / PAUSADA
}

export async function createListing(input: {
  userId: string;
  vehicleType: VehicleType;
  brandSlug: string;
  modelSlug: string;
  year: number;
  version?: string;
  condition: VehicleCondition;
  transmission?: "MECANICA" | "ASISTIDA";
  description?: string;
  price: number;
  currency: Currency;
  priceNegotiable: boolean;
  acceptsTrade: boolean;
  acceptsFinancing: boolean;
  mileageKm?: number;
  city?: string;
  province?: string;
  contactAddress?: string;
  /** "No, guardar como borrador" en el paso final del wizard. */
  asDraft?: boolean;
}) {
  // Guardar como borrador nunca consume cupo ni está bloqueado por
  // suspensión; publicar de una sí.
  const activation = input.asDraft ? null : await loadActivationContext(input.userId);
  if (activation) {
    assertNotSuspended(activation.isSuspended);
    assertAvailable(activation.available);
  }

  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: input.brandSlug } });
  const model = await prisma.model.findFirstOrThrow({
    where: { slug: input.modelSlug, brandId: brand.id, vehicleType: input.vehicleType },
  });

  // El título siempre se compone Marca + Modelo + Año, nunca es texto libre.
  const title = `${brand.name} ${model.name} ${input.year}`;
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.listing.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${attempt++}`;
  }

  const listingData = {
    slug,
    userId: input.userId,
    vehicleType: input.vehicleType,
    brandId: brand.id,
    modelId: model.id,
    year: input.year,
    title,
    version: input.version,
    condition: input.condition,
    transmission: input.transmission,
    description: input.description,
    price: input.price,
    currency: input.currency,
    priceNegotiable: input.priceNegotiable,
    acceptsTrade: input.acceptsTrade,
    acceptsFinancing: input.acceptsFinancing,
    mileageKm: input.mileageKm,
    city: input.city,
    province: input.province,
    contactAddress: input.contactAddress,
    ...(input.asDraft
      ? { status: "DRAFT" as const }
      : {
          status: "ACTIVE" as const,
          publishedAt: new Date(),
          expiresAt: activation!.expiresAt,
          ...(activation!.useFeaturedVoucher
            ? {
                featured: true,
                featuredSince: new Date(),
                featuredUntil: new Date(Date.now() + FEATURED_VOUCHER_DAYS * 24 * 60 * 60 * 1000),
              }
            : {}),
        }),
  };

  // Un borrador no "pasó por activa" todavía, así que no suma ni al contador
  // de publicaciones realizadas ni al cupo consumido hasta que se publique
  // de verdad.
  const [listing] = await prisma.$transaction([
    prisma.listing.create({ data: listingData }),
    ...(activation
      ? [
          prisma.user.update({
            where: { id: input.userId },
            data: {
              activationCount: { increment: 1 },
              quotaConsumed: { increment: 1 },
              ...(activation.useFeaturedVoucher ? { pendingFeaturedVouchers: { decrement: 1 } } : {}),
            },
          }),
        ]
      : []),
  ]);
  return listing;
}

export async function attachListingImages(listingId: string, urls: string[]) {
  // Arranca después del `order` más alto ya existente — si no, al editar y
  // agregar fotos nuevas, sus `order` (0,1,2…) chocaban con los de las fotos
  // que ya estaban (que también empiezan en 0).
  const { _max } = await prisma.image.aggregate({ where: { listingId }, _max: { order: true } });
  const startOrder = (_max.order ?? -1) + 1;
  await prisma.image.createMany({
    data: urls.map((url, i) => ({ listingId, url, order: startOrder + i })),
  });
}

export class LastImageError extends Error {
  constructor() {
    super("La publicación necesita al menos una foto — subí otra antes de borrar esta.");
    this.name = "LastImageError";
  }
}

/**
 * No borra el archivo en Supabase Storage, solo la fila — mismo límite ya
 * documentado para eliminar una publicación entera (ver ERRORES.md).
 */
export async function deleteListingImage(listingId: string, imageId: string, userId: string) {
  await assertOwnership(listingId, userId);
  const imageCount = await prisma.image.count({ where: { listingId } });
  if (imageCount <= 1) throw new LastImageError();
  await prisma.image.deleteMany({ where: { id: imageId, listingId } });
}

export class ImageMismatchError extends Error {
  constructor() {
    super("La lista de fotos no coincide con las fotos actuales — recargá la página e intentá de nuevo.");
    this.name = "ImageMismatchError";
  }
}

/** La portada es siempre la primera del array — `orderedImageIds` viene ya reordenado del cliente. */
export async function reorderListingImages(listingId: string, orderedImageIds: string[], userId: string) {
  await assertOwnership(listingId, userId);
  const images = await prisma.image.findMany({ where: { listingId }, select: { id: true } });
  const validIds = new Set(images.map((i) => i.id));
  if (orderedImageIds.length !== images.length || !orderedImageIds.every((id) => validIds.has(id))) {
    throw new ImageMismatchError();
  }
  await prisma.$transaction(
    orderedImageIds.map((id, order) => prisma.image.update({ where: { id }, data: { order } }))
  );
}

async function assertOwnership(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { userId: true, deletedAt: true } });
  if (!listing || listing.userId !== userId || listing.deletedAt) {
    throw new Error("No tenés permiso para modificar esta publicación.");
  }
}

export class ListingSuspendedError extends Error {
  constructor() {
    super("Esta publicación está suspendida — no se puede editar ni reactivar mientras dure.");
    this.name = "ListingSuspendedError";
  }
}

function assertListingNotSuspended(suspendedUntil: Date | null) {
  if (suspendedUntil && suspendedUntil.getTime() > Date.now()) throw new ListingSuspendedError();
}

const REACTIVATABLE_STATUSES: ListingStatus[] = ["RESERVADA", "PAUSADA", "EXPIRED", "DRAFT"];

export async function updateOwnedListing(
  listingId: string,
  userId: string,
  data: {
    version?: string;
    condition?: VehicleCondition;
    transmission?: "MECANICA" | "ASISTIDA";
    description?: string;
    price: number;
    currency: Currency;
    priceNegotiable: boolean;
    acceptsTrade: boolean;
    acceptsFinancing: boolean;
    mileageKm?: number;
    city?: string;
    province?: string;
    contactAddress?: string;
  }
) {
  await assertOwnership(listingId, userId);
  const current = await prisma.listing.findUniqueOrThrow({
    where: { id: listingId },
    select: { status: true, suspendedUntil: true },
  });
  assertListingNotSuspended(current.suspendedUntil);

  // Guardar cambios en una publicación borrador/reservada/pausada/vencida la
  // vuelve a activar automáticamente ("¿conservar tus datos? Sí, editar" en
  // la UI, o "publicar" para un borrador). Una vendida nunca se reactiva
  // sola por edición.
  const reactivating = REACTIVATABLE_STATUSES.includes(current.status);
  const cost = reactivating ? getReactivationCost(current.status) : null;
  const activation = reactivating ? await loadActivationContext(userId) : null;
  if (reactivating) assertNotSuspended(activation!.isSuspended);
  if (cost?.consumesQuota) assertAvailable(activation!.available);

  const [listing] = await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: {
        ...data,
        ...(reactivating
          ? {
              status: "ACTIVE" as const,
              soldAt: null,
              expiresAt: activation!.expiresAt,
              ...(cost?.countsAsNewListing ? { publishedAt: new Date() } : {}),
              ...(activation!.useFeaturedVoucher
                ? {
                    featured: true,
                    featuredSince: new Date(),
                    featuredUntil: new Date(Date.now() + FEATURED_VOUCHER_DAYS * 24 * 60 * 60 * 1000),
                  }
                : {}),
            }
          : {}),
      },
    }),
    ...(reactivating && (cost?.consumesQuota || activation!.useFeaturedVoucher)
      ? [
          prisma.user.update({
            where: { id: userId },
            data: {
              ...(cost?.consumesQuota ? { quotaConsumed: { increment: 1 } } : {}),
              ...(cost?.countsAsNewListing ? { activationCount: { increment: 1 } } : {}),
              ...(activation!.useFeaturedVoucher ? { pendingFeaturedVouchers: { decrement: 1 } } : {}),
            },
          }),
        ]
      : []),
  ]);
  return { listing, reactivated: reactivating };
}

/** Reactiva sin pasar por edición ("No, publicar" al reactivar). */
export async function reactivateListing(listingId: string, userId: string) {
  await assertOwnership(listingId, userId);
  const current = await prisma.listing.findUniqueOrThrow({
    where: { id: listingId },
    select: { status: true, suspendedUntil: true },
  });
  assertListingNotSuspended(current.suspendedUntil);
  if (!REACTIVATABLE_STATUSES.includes(current.status)) {
    throw new Error("Esta publicación no se puede reactivar.");
  }
  const cost = getReactivationCost(current.status);
  const activation = await loadActivationContext(userId);
  assertNotSuspended(activation.isSuspended);
  if (cost.consumesQuota) assertAvailable(activation.available);

  const [listing] = await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: {
        status: "ACTIVE",
        soldAt: null,
        expiresAt: activation.expiresAt,
        ...(cost.countsAsNewListing ? { publishedAt: new Date() } : {}),
        ...(activation.useFeaturedVoucher
          ? {
              featured: true,
              featuredSince: new Date(),
              featuredUntil: new Date(Date.now() + FEATURED_VOUCHER_DAYS * 24 * 60 * 60 * 1000),
            }
          : {}),
      },
    }),
    ...(cost.consumesQuota || activation.useFeaturedVoucher
      ? [
          prisma.user.update({
            where: { id: userId },
            data: {
              ...(cost.consumesQuota ? { quotaConsumed: { increment: 1 } } : {}),
              ...(cost.countsAsNewListing ? { activationCount: { increment: 1 } } : {}),
              ...(activation.useFeaturedVoucher ? { pendingFeaturedVouchers: { decrement: 1 } } : {}),
            },
          }),
        ]
      : []),
  ]);
  return listing;
}

export async function markListingAsSold(
  listingId: string,
  userId: string,
  details: {
    soldAt?: Date;
    buyerInfo?: string;
    realSalePrice?: number;
    saleConditions?: string;
  } = {}
) {
  await assertOwnership(listingId, userId);
  return prisma.listing.update({
    where: { id: listingId },
    data: { status: "SOLD", soldAt: details.soldAt ?? new Date(), ...details },
  });
}

/** "Pausar" con motivo: RESERVADA se sigue mostrando en el catálogo, PAUSADA no. */
export async function setListingPauseStatus(
  listingId: string,
  userId: string,
  status: "RESERVADA" | "PAUSADA"
) {
  await assertOwnership(listingId, userId);
  return prisma.listing.update({ where: { id: listingId }, data: { status } });
}

export async function deleteOwnedListing(listingId: string, userId: string) {
  await assertOwnership(listingId, userId);
  await prisma.listing.delete({ where: { id: listingId } });
}

export async function getOwnedListingForEdit(listingId: string, userId: string) {
  return prisma.listing.findFirst({
    where: { id: listingId, userId, deletedAt: null },
    include: { images: { orderBy: { order: "asc" } }, brand: true, model: true },
  });
}

/**
 * Estado mínimo de una publicación propia para validar una compra de
 * destacado (ownership + ACTIVE + no destacada todavía) — usado por
 * `purchaseFeatureByDays`/`purchaseFeatureCombo` en `server/data/payments.ts`
 * antes de armar su propia transacción (Payment + Listing.update).
 */
export async function getListingForFeatureCheck(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      userId: true,
      title: true,
      status: true,
      expiresAt: true,
      featured: true,
      featuredUntil: true,
      deletedAt: true,
    },
  });
  if (!listing || listing.userId !== userId || listing.deletedAt) return null;
  return listing;
}

/** Publicaciones propias elegibles para destacar (activas, no destacadas todavía) — selector de Mis compras. */
export async function getFeaturableListings(userId: string) {
  const listings = await prisma.listing.findMany({
    where: { userId, status: "ACTIVE", deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: CARD_INCLUDE,
  });
  return listings
    .filter((l) => !getEffectiveFeatured(l.featured, l.featuredUntil))
    .map((l) => ({
      id: l.id,
      title: l.title,
      price: Number(l.price),
      currency: l.currency,
      imageUrl: l.images[0]?.url ?? FALLBACK_IMAGE,
      expiresAt: l.expiresAt,
    }));
}

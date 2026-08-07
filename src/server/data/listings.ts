import "server-only";
import { prisma } from "@/lib/prisma";
import type { Currency, ListingStatus, Prisma, VehicleCondition, VehicleType } from "@/generated/prisma/client";
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
    featured: listing.featured,
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

function getEffectiveStatus(status: ListingStatus, expiresAt: Date | null): ListingStatus {
  if (EXPIRABLE_STATUSES.includes(status) && expiresAt && expiresAt.getTime() < Date.now()) {
    return "EXPIRED";
  }
  return status;
}

// No vencido = sin fecha límite todavía, o la fecha límite no pasó.
function notExpiredWhere(): Prisma.ListingWhereInput {
  return { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] };
}

function visibleStatusWhere(): Prisma.ListingWhereInput {
  return {
    OR: PUBLICLY_VISIBLE_STATUSES.map((status) => ({ status, ...notExpiredWhere() })),
  };
}

function buildWhere(filters: CatalogFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = visibleStatusWhere();

  if (filters.vehicleType) where.vehicleType = filters.vehicleType;
  if (filters.brandSlug) where.brand = { slug: filters.brandSlug };
  if (filters.modelSlug) where.model = { slug: filters.modelSlug };
  if (filters.year) where.year = filters.year;
  if (filters.condition) where.condition = filters.condition;

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

export async function getCatalogResults(filters: CatalogFilters) {
  const baseWhere = buildWhere(filters);

  const [featured, rest] = await Promise.all([
    prisma.listing.findMany({
      where: { ...baseWhere, featured: true },
      orderBy: { createdAt: "desc" },
      include: CARD_INCLUDE,
    }),
    prisma.listing.findMany({
      where: { ...baseWhere, featured: false },
      orderBy: { createdAt: "desc" },
      include: CARD_INCLUDE,
    }),
  ]);

  return {
    featured: featured.map(toVehicleCardData),
    rest: rest.map(toVehicleCardData),
  };
}

export async function getFeaturedListings(limit = 3) {
  const listings = await prisma.listing.findMany({
    where: { ...visibleStatusWhere(), featured: true },
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
          agencyProfile: { select: { businessName: true, city: true, province: true, address: true } },
        },
      },
    },
  });
  if (!listing) return null;

  const isOwner = viewerUserId && listing.userId === viewerUserId;
  if (isOwner) return listing;

  const effectiveStatus = getEffectiveStatus(listing.status, listing.expiresAt);
  const isVisible = PUBLICLY_VISIBLE_STATUSES.includes(
    effectiveStatus as (typeof PUBLICLY_VISIBLE_STATUSES)[number]
  );
  return isVisible ? listing : null;
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
};

function toOwnerListingData(listing: ListingWithCardData): OwnerListingData {
  return {
    ...toVehicleCardData(listing),
    id: listing.id,
    status: getEffectiveStatus(listing.status, listing.expiresAt),
    createdAt: listing.createdAt,
    publishedAt: listing.publishedAt,
    expiresAt: listing.expiresAt,
  };
}

export async function getOwnerListingGroups(userId: string) {
  const listings = await prisma.listing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: CARD_INCLUDE,
  });

  const withEffectiveStatus = listings.map((l) => ({
    listing: l,
    status: getEffectiveStatus(l.status, l.expiresAt),
  }));

  return {
    destacadas: withEffectiveStatus
      .filter((l) => l.status === "ACTIVE" && l.listing.featured)
      .map((l) => toOwnerListingData(l.listing)),
    activas: withEffectiveStatus
      .filter((l) => l.status === "ACTIVE" && !l.listing.featured)
      .map((l) => toOwnerListingData(l.listing)),
    reservadas: withEffectiveStatus.filter((l) => l.status === "RESERVADA").map((l) => toOwnerListingData(l.listing)),
    // Borrador, pausada y vencida: en las tres se dejó de operar el anuncio
    // con normalidad. El badge de cada card indica el estado real y las
    // acciones disponibles varían según corresponda (ver OwnerListingCard).
    inactivas: withEffectiveStatus
      .filter((l) => l.status === "DRAFT" || l.status === "PAUSADA" || l.status === "EXPIRED")
      .map((l) => toOwnerListingData(l.listing)),
    vendidas: withEffectiveStatus.filter((l) => l.status === "SOLD").map((l) => toOwnerListingData(l.listing)),
  };
}

const LISTING_DURATION_DAYS = 30;

// Cupo gratuito de publicaciones por cuenta. El disponible es
// FREE_PUBLICATION_QUOTA + purchasedPublications - activationCount (ver
// modelo User en schema.prisma). Comprar un pack suma a `purchasedPublications`.
export const FREE_PUBLICATION_QUOTA = 10;

export class QuotaExceededError extends Error {
  constructor() {
    super("No te quedan publicaciones disponibles. Comprá un pack para seguir publicando.");
    this.name = "QuotaExceededError";
  }
}

export async function getAvailablePublications(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { activationCount: true, purchasedPublications: true },
  });
  return Math.max(0, FREE_PUBLICATION_QUOTA + user.purchasedPublications - user.activationCount);
}

async function assertHasAvailablePublications(userId: string) {
  const available = await getAvailablePublications(userId);
  if (available <= 0) throw new QuotaExceededError();
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
  // Guardar como borrador nunca consume cupo; publicar de una sí.
  if (!input.asDraft) await assertHasAvailablePublications(input.userId);

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
          expiresAt: new Date(Date.now() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000),
        }),
  };

  // Un borrador no "pasó por activa" todavía, así que no suma al contador
  // de activaciones hasta que se publique de verdad.
  const [listing] = await prisma.$transaction([
    prisma.listing.create({ data: listingData }),
    ...(input.asDraft
      ? []
      : [prisma.user.update({ where: { id: input.userId }, data: { activationCount: { increment: 1 } } })]),
  ]);
  return listing;
}

export async function attachListingImages(listingId: string, urls: string[]) {
  await prisma.image.createMany({
    data: urls.map((url, order) => ({ listingId, url, order })),
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

async function assertOwnership(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { userId: true } });
  if (!listing || listing.userId !== userId) {
    throw new Error("No tenés permiso para modificar esta publicación.");
  }
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
    select: { status: true },
  });

  // Guardar cambios en una publicación borrador/reservada/pausada/vencida la
  // vuelve a activar automáticamente ("¿conservar tus datos? Sí, editar" en
  // la UI, o "publicar" para un borrador). Una vendida nunca se reactiva
  // sola por edición.
  const reactivating = REACTIVATABLE_STATUSES.includes(current.status);
  const wasDraft = current.status === "DRAFT";

  if (reactivating) await assertHasAvailablePublications(userId);

  const [listing] = await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: {
        ...data,
        ...(reactivating
          ? {
              status: "ACTIVE" as const,
              soldAt: null,
              expiresAt: new Date(Date.now() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000),
              ...(wasDraft ? { publishedAt: new Date() } : {}),
            }
          : {}),
      },
    }),
    ...(reactivating
      ? [prisma.user.update({ where: { id: userId }, data: { activationCount: { increment: 1 } } })]
      : []),
  ]);
  return { listing, reactivated: reactivating };
}

export async function markListingAsSold(listingId: string, userId: string) {
  await assertOwnership(listingId, userId);
  return prisma.listing.update({
    where: { id: listingId },
    data: { status: "SOLD", soldAt: new Date() },
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
    where: { id: listingId, userId },
    include: { images: { orderBy: { order: "asc" } }, brand: true, model: true },
  });
}

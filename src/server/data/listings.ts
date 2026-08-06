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

function buildWhere(filters: CatalogFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: { in: [...PUBLICLY_VISIBLE_STATUSES] } };

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
    where: { status: { in: [...PUBLICLY_VISIBLE_STATUSES] }, featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: CARD_INCLUDE,
  });
  return listings.map(toVehicleCardData);
}

export async function getListingBySlug(slug: string) {
  return prisma.listing.findUnique({
    where: { slug, status: { in: [...PUBLICLY_VISIBLE_STATUSES] } },
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
}

export async function getActiveListingsByUser(userId: string) {
  const listings = await prisma.listing.findMany({
    where: { userId, status: { in: [...PUBLICLY_VISIBLE_STATUSES] } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: CARD_INCLUDE,
  });
  return listings.map(toVehicleCardData);
}

export type OwnerListingData = VehicleCardData & { id: string; status: ListingStatus };

function toOwnerListingData(listing: ListingWithCardData): OwnerListingData {
  return { ...toVehicleCardData(listing), id: listing.id, status: listing.status };
}

export async function getOwnerListingGroups(userId: string) {
  const listings = await prisma.listing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: CARD_INCLUDE,
  });

  return {
    destacadas: listings.filter((l) => l.status === "ACTIVE" && l.featured).map(toOwnerListingData),
    activas: listings.filter((l) => l.status === "ACTIVE" && !l.featured).map(toOwnerListingData),
    // Reservadas y pausadas van junto con vencidas/vendidas: en las tres se
    // dejó de operar el anuncio con normalidad y todas ofrecen "Reactivar"
    // (salvo vendida). El badge de cada card indica el estado real.
    inactivas: listings
      .filter((l) => l.status === "RESERVADA" || l.status === "PAUSADA" || l.status === "EXPIRED" || l.status === "SOLD")
      .map(toOwnerListingData),
  };
}

const LISTING_DURATION_DAYS = 60;

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
}) {
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

  const [listing] = await prisma.$transaction([
    prisma.listing.create({
      data: {
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
        status: "ACTIVE",
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000),
      },
    }),
    // Contador de "veces que pasó a activa" — publicar cuenta como la primera.
    prisma.user.update({ where: { id: input.userId }, data: { activationCount: { increment: 1 } } }),
  ]);
  return listing;
}

export async function attachListingImages(listingId: string, urls: string[]) {
  await prisma.image.createMany({
    data: urls.map((url, order) => ({ listingId, url, order })),
  });
}

async function assertOwnership(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { userId: true } });
  if (!listing || listing.userId !== userId) {
    throw new Error("No tenés permiso para modificar esta publicación.");
  }
}

const REACTIVATABLE_STATUSES: ListingStatus[] = ["RESERVADA", "PAUSADA", "EXPIRED"];

export async function updateOwnedListing(
  listingId: string,
  userId: string,
  data: {
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

  // Guardar cambios en una publicación reservada/pausada/vencida la vuelve a
  // activar automáticamente ("¿conservar tus datos? Sí, editar" en la UI).
  // Una vendida nunca se reactiva sola por edición.
  const reactivating = REACTIVATABLE_STATUSES.includes(current.status);

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
            }
          : {}),
      },
    }),
    ...(reactivating
      ? [prisma.user.update({ where: { id: userId }, data: { activationCount: { increment: 1 } } })]
      : []),
  ]);
  return listing;
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

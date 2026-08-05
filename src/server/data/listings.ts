import "server-only";
import { prisma } from "@/lib/prisma";
import type { Currency, Prisma, VehicleType } from "@/generated/prisma/client";
import type { VehicleCardData } from "@/types/vehicle";
import { FALLBACK_IMAGE } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export type CatalogFilters = {
  vehicleType?: VehicleType;
  brandSlug?: string;
  modelSlug?: string;
  year?: number;
  currency?: Currency;
  minPrice?: number;
  maxPrice?: number;
  minKm?: number;
  maxKm?: number;
};

const CARD_INCLUDE = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
} satisfies Prisma.ListingInclude;

type ListingWithCardData = Prisma.ListingGetPayload<{ include: typeof CARD_INCLUDE }>;

export function toVehicleCardData(listing: ListingWithCardData): VehicleCardData {
  return {
    slug: listing.slug,
    title: listing.title,
    price: Number(listing.price),
    currency: listing.currency,
    year: listing.year,
    mileageKm: listing.mileageKm ?? 0,
    imageUrl: listing.images[0]?.url ?? FALLBACK_IMAGE,
    featured: listing.featured,
    vehicleType: listing.vehicleType,
  };
}

function buildWhere(filters: CatalogFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: "ACTIVE" };

  if (filters.vehicleType) where.vehicleType = filters.vehicleType;
  if (filters.brandSlug) where.brand = { slug: filters.brandSlug };
  if (filters.modelSlug) where.model = { slug: filters.modelSlug };
  if (filters.year) where.year = filters.year;

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
    where: { status: "ACTIVE", featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: CARD_INCLUDE,
  });
  return listings.map(toVehicleCardData);
}

export async function getListingBySlug(slug: string) {
  return prisma.listing.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { orderBy: { order: "asc" } },
      brand: true,
      model: true,
      user: {
        select: {
          fullName: true,
          phone: true,
          accountType: true,
          agencyProfile: { select: { businessName: true, city: true, province: true } },
        },
      },
    },
  });
}

export async function getActiveListingsByUser(userId: string) {
  const listings = await prisma.listing.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: CARD_INCLUDE,
  });
  return listings.map(toVehicleCardData);
}

export type OwnerListingData = VehicleCardData & { id: string; status: "DRAFT" | "ACTIVE" | "EXPIRED" | "SOLD" };

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
    inactivas: listings
      .filter((l) => l.status === "EXPIRED" || l.status === "SOLD")
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
  title: string;
  description: string;
  price: number;
  currency: Currency;
  mileageKm?: number;
  city?: string;
  province?: string;
}) {
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: input.brandSlug } });
  const model = await prisma.model.findFirstOrThrow({
    where: { slug: input.modelSlug, brandId: brand.id, vehicleType: input.vehicleType },
  });

  const baseSlug = slugify(input.title);
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.listing.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${attempt++}`;
  }

  return prisma.listing.create({
    data: {
      slug,
      userId: input.userId,
      vehicleType: input.vehicleType,
      brandId: brand.id,
      modelId: model.id,
      year: input.year,
      title: input.title,
      description: input.description,
      price: input.price,
      currency: input.currency,
      mileageKm: input.mileageKm,
      city: input.city,
      province: input.province,
      status: "ACTIVE",
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
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

export async function updateOwnedListing(
  listingId: string,
  userId: string,
  data: {
    title: string;
    description: string;
    price: number;
    currency: Currency;
    mileageKm?: number;
    city?: string;
    province?: string;
  }
) {
  await assertOwnership(listingId, userId);
  return prisma.listing.update({ where: { id: listingId }, data });
}

export async function markListingAsSold(listingId: string, userId: string) {
  await assertOwnership(listingId, userId);
  return prisma.listing.update({
    where: { id: listingId },
    data: { status: "SOLD", soldAt: new Date() },
  });
}

export async function reactivateListing(listingId: string, userId: string) {
  await assertOwnership(listingId, userId);
  return prisma.listing.update({
    where: { id: listingId },
    data: {
      status: "ACTIVE",
      soldAt: null,
      expiresAt: new Date(Date.now() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
}

export async function getOwnedListingForEdit(listingId: string, userId: string) {
  return prisma.listing.findFirst({
    where: { id: listingId, userId },
    include: { images: { orderBy: { order: "asc" } }, brand: true, model: true },
  });
}

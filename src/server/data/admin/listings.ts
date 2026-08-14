import "server-only";
import { prisma } from "@/lib/prisma";
import type { ListingStatus, Prisma, VehicleType } from "@/generated/prisma/client";
import type { UpdateListingInput } from "@/lib/validations/listing";

export type AdminListingFilters = {
  search?: string;
  status?: ListingStatus;
  vehicleType?: VehicleType;
  showDeleted?: boolean;
};

const ADMIN_LISTING_PAGE_SIZE = 25;

const ADMIN_LISTING_INCLUDE = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
  user: { select: { id: true, email: true, fullName: true } },
} satisfies Prisma.ListingInclude;

function buildListingWhere(filters: AdminListingFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    deletedAt: filters.showDeleted ? { not: null } : null,
  };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.vehicleType) where.vehicleType = filters.vehicleType;

  return where;
}

/**
 * Distinta de `getCatalogResults`: esa fuerza `visibleStatusWhere()` (solo
 * lo público) — acá el admin necesita encontrar cualquier estado, incluidas
 * borrador/pausada/vencida/vendida/borradas lógicamente.
 */
export async function listListingsForAdmin(filters: AdminListingFilters, page = 1) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const where = buildListingWhere(filters);

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ADMIN_LISTING_PAGE_SIZE,
      take: ADMIN_LISTING_PAGE_SIZE,
      include: ADMIN_LISTING_INCLUDE,
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    listings,
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_LISTING_PAGE_SIZE)),
  };
}

/** Sin paginar — usado por la exportación CSV. */
export async function listAllListingsForAdmin(filters: AdminListingFilters) {
  return prisma.listing.findMany({
    where: buildListingWhere(filters),
    orderBy: { createdAt: "desc" },
    include: ADMIN_LISTING_INCLUDE,
  });
}

export async function getListingForAdminDetail(listingId: string) {
  return prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      images: { orderBy: { order: "asc" } },
      brand: true,
      model: true,
      user: { select: { id: true, email: true, fullName: true } },
    },
  });
}

/** Edición de admin: NO es una "republicación" — no toca cupo/activationCount/expiresAt, a diferencia de `updateOwnedListing`. Tipo/marca/modelo/año quedan fuera (mismo límite que ya tiene el dueño, ver ARCHITECTURE.md). */
export async function adminUpdateListing(listingId: string, data: UpdateListingInput) {
  return prisma.listing.update({ where: { id: listingId }, data });
}

export async function adminSetListingStatus(listingId: string, status: ListingStatus) {
  return prisma.listing.update({
    where: { id: listingId },
    data: { status, ...(status === "SOLD" ? { soldAt: new Date() } : {}) },
  });
}

/** A diferencia de `deleteOwnedListing` (DELETE real, solo para el dueño sobre una publicación sin historial) — esta es la baja administrativa, reversible. */
export async function softDeleteListing(listingId: string) {
  return prisma.listing.update({ where: { id: listingId }, data: { deletedAt: new Date() } });
}

export async function restoreListing(listingId: string) {
  return prisma.listing.update({ where: { id: listingId }, data: { deletedAt: null } });
}

// --- Destacados (mismo archivo: son el mismo modelo `Listing`) ---

export async function listFeaturedListingsForAdmin(page = 1) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const where: Prisma.ListingWhereInput = { featured: true, deletedAt: null };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { featuredUntil: "desc" },
      skip: (safePage - 1) * ADMIN_LISTING_PAGE_SIZE,
      take: ADMIN_LISTING_PAGE_SIZE,
      include: ADMIN_LISTING_INCLUDE,
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    listings,
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_LISTING_PAGE_SIZE)),
  };
}

export async function setListingFeatured(listingId: string, featured: boolean, featuredUntil: Date | null) {
  return prisma.listing.update({ where: { id: listingId }, data: { featured, featuredUntil } });
}

import "server-only";
import { prisma } from "@/lib/prisma";
import type { VehicleType } from "@/generated/prisma/client";

export async function getBrandsForType(vehicleType?: VehicleType) {
  return prisma.brand.findMany({
    where: vehicleType ? { models: { some: { vehicleType } } } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getModelsForBrand(brandSlug: string, vehicleType?: VehicleType) {
  return prisma.model.findMany({
    where: {
      brand: { slug: brandSlug },
      ...(vehicleType ? { vehicleType } : {}),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, vehicleType: true },
  });
}

export async function getAvailableYears(filters: {
  vehicleType?: VehicleType;
  brandSlug?: string;
  modelSlug?: string;
}) {
  const rows = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(filters.vehicleType ? { vehicleType: filters.vehicleType } : {}),
      ...(filters.brandSlug ? { brand: { slug: filters.brandSlug } } : {}),
      ...(filters.modelSlug ? { model: { slug: filters.modelSlug } } : {}),
    },
    distinct: ["year"],
    select: { year: true },
    orderBy: { year: "desc" },
  });
  return rows.map((r) => r.year);
}

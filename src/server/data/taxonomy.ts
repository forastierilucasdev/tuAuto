import "server-only";
import { prisma } from "@/lib/prisma";

export async function getBrandsForType(vehicleTypeCode?: string) {
  return prisma.brand.findMany({
    where: vehicleTypeCode ? { models: { some: { vehicleType: { code: vehicleTypeCode } } } } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getModelsForBrand(brandSlug: string, vehicleTypeCode?: string) {
  return prisma.model.findMany({
    where: { brand: { slug: brandSlug }, ...(vehicleTypeCode ? { vehicleType: { code: vehicleTypeCode } } : {}) },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getAvailableYears(filters: { vehicleTypeCode?: string; brandSlug?: string; modelSlug?: string }) {
  const rows = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(filters.vehicleTypeCode ? { vehicleType: { code: filters.vehicleTypeCode } } : {}),
      ...(filters.brandSlug ? { brand: { slug: filters.brandSlug } } : {}),
      ...(filters.modelSlug ? { model: { slug: filters.modelSlug } } : {}),
    },
    distinct: ["year"],
    select: { year: true },
    orderBy: { year: "desc" },
  });
  return rows.map((r) => r.year);
}

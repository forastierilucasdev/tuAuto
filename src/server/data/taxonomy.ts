import "server-only";
import { prisma } from "@/lib/prisma";

export async function getBrandsForType(vehicleTypeCode?: string) {
  return prisma.brand.findMany({
    where: {
      isActive: true,
      ...(vehicleTypeCode ? { models: { some: { vehicleType: { code: vehicleTypeCode }, isActive: true } } } : {}),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getModelsForBrand(brandSlug: string, vehicleTypeCode?: string) {
  return prisma.model.findMany({
    where: {
      brand: { slug: brandSlug },
      isActive: true,
      ...(vehicleTypeCode ? { vehicleType: { code: vehicleTypeCode } } : {}),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

/** Versiones activas de un modelo — mismo patrón que `getModelsForBrand`, cuarto nivel de la cascada Tipo→Marca→Modelo→Versión. */
export async function getVersionsForModel(modelSlug: string, brandSlug: string) {
  return prisma.version.findMany({
    where: { model: { slug: modelSlug, brand: { slug: brandSlug } }, isActive: true },
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

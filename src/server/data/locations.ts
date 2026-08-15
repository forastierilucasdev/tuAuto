import "server-only";
import { prisma } from "@/lib/prisma";

/** Provincias activas — cascada Provincia→Localidad usada por el wizard, mismo patrón que `getBrandsForType`. */
export async function getProvinces() {
  return prisma.province.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
}

export async function getLocalitiesForProvince(provinceSlug: string) {
  return prisma.locality.findMany({
    where: { province: { slug: provinceSlug }, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

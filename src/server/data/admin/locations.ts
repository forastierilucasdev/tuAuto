import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { PROVINCIAS } from "@/lib/constants";

export async function listProvincesForAdmin() {
  return prisma.province.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { localities: true } } },
  });
}

export async function getProvinceById(id: string) {
  return prisma.province.findUnique({ where: { id } });
}

export async function createProvince(data: { name: string }) {
  return prisma.province.create({ data: { name: data.name, slug: slugify(data.name) } });
}

export async function updateProvince(id: string, data: { name: string }) {
  return prisma.province.update({ where: { id }, data: { name: data.name, slug: slugify(data.name) } });
}

export async function toggleProvinceActive(id: string, isActive: boolean) {
  return prisma.province.update({ where: { id }, data: { isActive } });
}

/** Siembra las 24 provincias fijas de `constants.ts` — idempotente (omite las que ya existen por nombre). */
export async function seedProvincesFromConstant() {
  const existing = await prisma.province.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((p) => p.name));
  const toCreate = PROVINCIAS.filter((name) => !existingNames.has(name));
  if (toCreate.length === 0) return { created: 0 };

  await prisma.province.createMany({
    data: toCreate.map((name, index) => ({ name, slug: slugify(name), sortOrder: index })),
  });
  return { created: toCreate.length };
}

export async function listLocalitiesForProvince(provinceId: string) {
  return prisma.locality.findMany({
    where: { provinceId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function createLocality(data: { name: string; provinceId: string }) {
  return prisma.locality.create({ data: { name: data.name, slug: slugify(data.name), provinceId: data.provinceId } });
}

export async function updateLocality(id: string, data: { name: string }) {
  return prisma.locality.update({ where: { id }, data: { name: data.name, slug: slugify(data.name) } });
}

export async function toggleLocalityActive(id: string, isActive: boolean) {
  return prisma.locality.update({ where: { id }, data: { isActive } });
}

/**
 * Alta masiva: una localidad por línea de textarea (sin parser de CSV en el
 * proyecto, es la opción de menor esfuerzo). Ignora líneas vacías y nombres
 * duplicados (contra lo ya existente en esa provincia, case-insensitive).
 */
export async function createLocalitiesBulk(provinceId: string, rawNames: string[]) {
  const names = [...new Set(rawNames.map((n) => n.trim()).filter(Boolean))];
  if (names.length === 0) return { created: 0, skipped: 0 };

  const existing = await prisma.locality.findMany({ where: { provinceId }, select: { name: true } });
  const existingLower = new Set(existing.map((l) => l.name.toLowerCase()));
  const toCreate = names.filter((n) => !existingLower.has(n.toLowerCase()));

  if (toCreate.length > 0) {
    await prisma.locality.createMany({
      data: toCreate.map((name) => ({ name, slug: slugify(name), provinceId })),
    });
  }
  return { created: toCreate.length, skipped: names.length - toCreate.length };
}

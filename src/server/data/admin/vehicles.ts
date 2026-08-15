import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// --- Marcas ---

export async function listBrandsForAdmin() {
  return prisma.brand.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
}

export async function getBrandById(id: string) {
  return prisma.brand.findUnique({ where: { id } });
}

export async function createBrand(data: { name: string; logoUrl: string | null }) {
  return prisma.brand.create({ data: { name: data.name, slug: slugify(data.name), logoUrl: data.logoUrl } });
}

/** `slug` nunca se edita — es lo que ya usan las URLs del catálogo y la cascada de taxonomía. */
export async function updateBrand(id: string, data: { name: string; logoUrl: string | null }) {
  return prisma.brand.update({ where: { id }, data });
}

export async function toggleBrandActive(id: string, isActive: boolean) {
  return prisma.brand.update({ where: { id }, data: { isActive } });
}

// --- Modelos ---

export async function listModelsForAdmin() {
  return prisma.model.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { brand: { select: { id: true, name: true } }, vehicleType: { select: { id: true, code: true, label: true } } },
  });
}

export async function getModelById(id: string) {
  return prisma.model.findUnique({ where: { id } });
}

export async function createModel(data: { name: string; brandId: string; vehicleTypeId: string }) {
  return prisma.model.create({
    data: { name: data.name, slug: slugify(data.name), brandId: data.brandId, vehicleTypeId: data.vehicleTypeId },
  });
}

export async function updateModel(id: string, data: { name: string; brandId: string; vehicleTypeId: string }) {
  return prisma.model.update({
    where: { id },
    data: { name: data.name, slug: slugify(data.name), brandId: data.brandId, vehicleTypeId: data.vehicleTypeId },
  });
}

export async function toggleModelActive(id: string, isActive: boolean) {
  return prisma.model.update({ where: { id }, data: { isActive } });
}

// --- Versiones ---

export async function listVersionsForAdmin() {
  return prisma.version.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { model: { select: { id: true, name: true, brand: { select: { id: true, name: true } } } } },
  });
}

export async function getVersionById(id: string) {
  return prisma.version.findUnique({ where: { id } });
}

export async function createVersion(data: { name: string; modelId: string }) {
  return prisma.version.create({ data: { name: data.name, slug: slugify(data.name), modelId: data.modelId } });
}

export async function updateVersion(id: string, data: { name: string; modelId: string }) {
  return prisma.version.update({ where: { id }, data: { name: data.name, slug: slugify(data.name), modelId: data.modelId } });
}

export async function toggleVersionActive(id: string, isActive: boolean) {
  return prisma.version.update({ where: { id }, data: { isActive } });
}

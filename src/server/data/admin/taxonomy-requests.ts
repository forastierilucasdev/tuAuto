import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { VerificationStatus } from "@/generated/prisma/client";

export async function listTaxonomyRequests(status?: VerificationStatus) {
  return prisma.taxonomyRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "asc" },
    include: { vehicleType: true, brand: true, _count: { select: { listings: true } } },
  });
}

export async function getTaxonomyRequestById(id: string) {
  return prisma.taxonomyRequest.findUnique({
    where: { id },
    include: {
      vehicleType: true,
      brand: true,
      listings: { select: { id: true, title: true, userId: true, user: { select: { fullName: true, email: true } } } },
    },
  });
}

/**
 * Aprobar: crea (o reusa, si ya existen por nombre) las filas reales de
 * Brand/Model/Version a partir de los nombres que confirma el admin (puede
 * editar el texto tecleado por el usuario antes de aprobar), y actualiza
 * TODOS los listings vinculados a esta solicitud con los FKs reales — no
 * toca `status`: cada listing sigue en PENDIENTE_APROBACION hasta su propia
 * revisión individual ("Validar datos", dos pasos separados a propósito).
 */
export async function approveTaxonomyRequest(
  requestId: string,
  data: { brandName: string; modelName: string; versionName: string }
) {
  const request = await prisma.taxonomyRequest.findUniqueOrThrow({ where: { id: requestId } });

  const brand = await prisma.brand.upsert({
    where: { slug: slugify(data.brandName) },
    update: {},
    create: { name: data.brandName, slug: slugify(data.brandName) },
  });
  const model = await prisma.model.upsert({
    where: { brandId_vehicleTypeId_name: { brandId: brand.id, vehicleTypeId: request.vehicleTypeId, name: data.modelName } },
    update: {},
    create: { name: data.modelName, slug: slugify(data.modelName), brandId: brand.id, vehicleTypeId: request.vehicleTypeId },
  });
  const version = await prisma.version.upsert({
    where: { modelId_name: { modelId: model.id, name: data.versionName } },
    update: {},
    create: { name: data.versionName, slug: slugify(data.versionName), modelId: model.id },
  });

  const [, { count: unblockedListings }] = await prisma.$transaction([
    prisma.taxonomyRequest.update({ where: { id: requestId }, data: { status: "APPROVED" } }),
    prisma.listing.updateMany({
      where: { pendingTaxonomyRequestId: requestId },
      data: {
        brandId: brand.id,
        modelId: model.id,
        versionId: version.id,
        version: version.name,
        pendingBrandName: null,
        pendingModelName: null,
        pendingVersionName: null,
        pendingTaxonomyRequestId: null,
      },
    }),
  ]);

  return { brand, model, version, unblockedListings };
}

export async function addTaxonomyRequestNote(requestId: string, note: string) {
  return prisma.taxonomyRequest.update({ where: { id: requestId }, data: { adminNote: note } });
}

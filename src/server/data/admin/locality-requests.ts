import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { VerificationStatus } from "@/generated/prisma/client";

export async function listLocalityRequests(status?: VerificationStatus) {
  return prisma.localityRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "asc" },
    include: { province: true, _count: { select: { listings: true } } },
  });
}

export async function getLocalityRequestById(id: string) {
  return prisma.localityRequest.findUnique({
    where: { id },
    include: {
      province: true,
      listings: { select: { id: true, title: true, userId: true, user: { select: { fullName: true, email: true } } } },
    },
  });
}

/** Mismo criterio que `approveTaxonomyRequest`: crea/reusa la `Locality` real y actualiza todos los listings vinculados, sin tocar `status`. */
export async function approveLocalityRequest(requestId: string, data: { name: string }) {
  const request = await prisma.localityRequest.findUniqueOrThrow({ where: { id: requestId } });

  const locality = await prisma.locality.upsert({
    where: { provinceId_name: { provinceId: request.provinceId, name: data.name } },
    update: {},
    create: { name: data.name, slug: slugify(data.name), provinceId: request.provinceId },
  });

  const [, { count: unblockedListings }] = await prisma.$transaction([
    prisma.localityRequest.update({ where: { id: requestId }, data: { status: "APPROVED" } }),
    prisma.listing.updateMany({
      where: { pendingLocalityRequestId: requestId },
      data: {
        localityId: locality.id,
        city: locality.name,
        pendingLocalityName: null,
        pendingLocalityRequestId: null,
      },
    }),
  ]);

  return { locality, unblockedListings };
}

export async function addLocalityRequestNote(requestId: string, note: string) {
  return prisma.localityRequest.update({ where: { id: requestId }, data: { adminNote: note } });
}

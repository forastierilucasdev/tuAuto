import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getVisibleListingCountByUser } from "@/server/data/listings";

export type AgencyAccountType = "AGENCIA" | "CONCESIONARIA";

export type AgencyFilters = {
  province?: string;
  city?: string;
  accountType?: AgencyAccountType;
};

async function loadAgencies(where: Prisma.AgencyProfileWhereInput) {
  const profiles = await prisma.agencyProfile.findMany({
    where,
    orderBy: { businessName: "asc" },
    include: { user: { select: { id: true, accountType: true } } },
  });

  // El contador de publicaciones reutiliza el mismo criterio de visibilidad
  // que "Mis publicaciones" / la página de detalle (activa o reservada, no
  // vencida) — así el número de la tarjeta coincide con lo que se ve al
  // entrar a "Ver publicaciones".
  return Promise.all(
    profiles.map(async (p) => ({
      userId: p.userId,
      accountType: p.user.accountType as AgencyAccountType,
      businessName: p.businessName,
      city: p.city,
      province: p.province,
      logoUrl: p.logoUrl,
      logoPositionX: p.logoPositionX,
      logoPositionY: p.logoPositionY,
      description: p.description,
      address: p.address,
      website: p.website,
      activeListings: await getVisibleListingCountByUser(p.user.id),
    }))
  );
}

export async function getAgencies(filters: AgencyFilters = {}) {
  const where: Prisma.AgencyProfileWhereInput = {};
  if (filters.province) where.province = { contains: filters.province, mode: "insensitive" };
  if (filters.city) where.city = { contains: filters.city, mode: "insensitive" };
  if (filters.accountType) where.user = { accountType: filters.accountType };
  return loadAgencies(where);
}

/** Las de más publicaciones activas primero — para "Concesionarias destacadas" / "Agencias destacadas". */
export async function getFeaturedAgencies(accountType: AgencyAccountType, limit = 4) {
  const agencies = await loadAgencies({ user: { accountType } });
  return agencies
    .filter((a) => a.activeListings > 0)
    .sort((a, b) => b.activeListings - a.activeListings)
    .slice(0, limit);
}

export async function getAgencyProfile(userId: string) {
  return prisma.agencyProfile.findUnique({
    where: { userId },
  });
}

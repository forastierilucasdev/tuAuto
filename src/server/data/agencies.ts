import "server-only";
import { prisma } from "@/lib/prisma";

export async function getAgencies() {
  const profiles = await prisma.agencyProfile.findMany({
    orderBy: { businessName: "asc" },
    include: {
      user: {
        select: {
          id: true,
          _count: { select: { listings: { where: { status: "ACTIVE" } } } },
        },
      },
    },
  });

  return profiles.map((p) => ({
    userId: p.userId,
    businessName: p.businessName,
    city: p.city,
    province: p.province,
    logoUrl: p.logoUrl,
    description: p.description,
    activeListings: p.user._count.listings,
  }));
}

export async function getAgencyProfile(userId: string) {
  return prisma.agencyProfile.findUnique({
    where: { userId },
  });
}

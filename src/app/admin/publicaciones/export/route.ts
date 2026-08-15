import { requireAdminPermission } from "@/lib/admin-permissions";
import { listAllListingsForAdmin } from "@/server/data/admin/listings";
import { buildCsv, csvResponse } from "@/lib/csv";
import { formatCurrency } from "@/lib/utils";
import type { ListingStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  await requireAdminPermission("publicaciones", "read");
  const { searchParams } = new URL(request.url);

  const listings = await listAllListingsForAdmin({
    search: searchParams.get("q") ?? undefined,
    status: (searchParams.get("estado") as ListingStatus) || undefined,
    vehicleType: searchParams.get("tipo") || undefined,
    showDeleted: searchParams.get("eliminadas") === "1",
  });

  const csv = buildCsv(
    ["Título", "Slug", "Dueño", "Email dueño", "Estado", "Precio", "Destacada", "Eliminada", "Alta"],
    listings.map((l) => [
      l.title,
      l.slug,
      l.user.fullName,
      l.user.email,
      l.status,
      formatCurrency(Number(l.price), l.currency),
      l.featured ? "Sí" : "No",
      l.deletedAt ? "Sí" : "No",
      l.createdAt,
    ])
  );

  return csvResponse(`publicaciones-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

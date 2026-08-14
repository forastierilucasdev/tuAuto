"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import { getListingForAdminDetail, setListingFeatured } from "@/server/data/admin/listings";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

export async function setFeaturedAction(listingId: string, days: number): Promise<AdminActionState> {
  const session = await requireAdminPermission("destacados", "edit");
  if (!Number.isInteger(days) || days <= 0 || days > 365) return { error: "Ingresá una cantidad de días válida." };

  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  const featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await setListingFeatured(listingId, true, featuredUntil);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.setFeatured",
    targetTable: "Listing",
    targetId: listingId,
    changes: {
      before: { featured: before.featured, featuredUntil: before.featuredUntil },
      after: { featured: true, featuredUntil },
    },
  });

  revalidatePath("/admin/destacados");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { success: true };
}

/** "Quitar destacado antes de tiempo": mismo criterio de vencimiento perezoso que ya usa todo el resto de la app — no hace falta tocar el boolean `featured`, `getEffectiveFeatured()` ya lo va a leer como no-destacado. */
export async function removeFeaturedEarlyAction(listingId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("destacados", "edit");
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  const featuredUntil = new Date();
  await setListingFeatured(listingId, before.featured, featuredUntil);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.removeFeaturedEarly",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { featuredUntil: before.featuredUntil }, after: { featuredUntil } },
  });

  revalidatePath("/admin/destacados");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { success: true };
}

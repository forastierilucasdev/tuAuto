"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import { getListingForAdminDetail, setListingFeatured } from "@/server/data/admin/listings";
import { getEffectiveFeatured } from "@/server/data/listings";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

/** "Agregar días": si ya está destacada y vigente, suma los días al vencimiento actual (no lo reemplaza) — `featuredSince` se conserva, es el mismo período. Si no está destacada o ya venció, arranca un período nuevo desde ahora. */
export async function setFeaturedAction(listingId: string, days: number): Promise<AdminActionState> {
  const session = await requireAdminPermission("destacados", "edit");
  if (!Number.isInteger(days) || days <= 0 || days > 365) return { error: "Ingresá una cantidad de días válida." };

  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  const isCurrentlyFeatured = getEffectiveFeatured(before.featured, before.featuredUntil);
  const now = new Date();
  const baseDate = isCurrentlyFeatured && before.featuredUntil ? before.featuredUntil : now;
  const featuredUntil = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  const featuredSince = isCurrentlyFeatured ? before.featuredSince : now;

  await setListingFeatured(listingId, true, featuredUntil, featuredSince);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.setFeatured",
    targetTable: "Listing",
    targetId: listingId,
    changes: {
      before: { featured: before.featured, featuredSince: before.featuredSince, featuredUntil: before.featuredUntil },
      after: { featured: true, featuredSince, featuredUntil, daysAdded: days },
    },
  });

  revalidatePath("/admin/destacados");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { success: true };
}

/** "Quitar destacado antes de tiempo": mismo criterio de vencimiento perezoso que ya usa todo el resto de la app — no hace falta tocar el boolean `featured`, `getEffectiveFeatured()` ya lo va a leer como no-destacado. Motivo obligatorio, queda en el registro de auditoría. */
export async function removeFeaturedEarlyAction(listingId: string, reason: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("destacados", "edit");
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 3) return { error: "Contanos el motivo de la baja." };

  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  const featuredUntil = new Date();
  await setListingFeatured(listingId, before.featured, featuredUntil);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.removeFeaturedEarly",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { featuredUntil: before.featuredUntil }, after: { featuredUntil, reason: trimmedReason } },
  });

  revalidatePath("/admin/destacados");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { success: true };
}

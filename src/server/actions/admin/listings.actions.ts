"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import {
  adminSetListingStatus,
  adminUpdateListing,
  getListingForAdminDetail,
  restoreListing,
  softDeleteListing,
} from "@/server/data/admin/listings";
import { updateListingSchema } from "@/lib/validations/listing";
import type { ListingStatus } from "@/generated/prisma/client";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

export async function adminUpdateListingAction(
  listingId: string,
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const session = await requireAdminPermission("publicaciones", "edit");
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  const raw = Object.fromEntries(formData);
  const parsed = updateListingSchema.safeParse(raw);
  if (!parsed.success) return { error: "Revisá los datos del formulario." };

  await adminUpdateListing(listingId, parsed.data);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.update",
    targetTable: "Listing",
    targetId: listingId,
    changes: {
      before: { price: before.price, description: before.description, condition: before.condition },
      after: { price: parsed.data.price, description: parsed.data.description, condition: parsed.data.condition },
    },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  return { success: true };
}

export async function adminSetListingStatusAction(listingId: string, status: ListingStatus): Promise<AdminActionState> {
  const session = await requireAdminPermission("publicaciones", "edit");
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  await adminSetListingStatus(listingId, status);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.setStatus",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { status: before.status }, after: { status } },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath("/catalogo");
  return { success: true };
}

export async function adminSoftDeleteListingAction(listingId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("publicaciones", "delete");
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  await softDeleteListing(listingId);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.softDelete",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { deletedAt: before.deletedAt }, after: { deletedAt: new Date() } },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath("/catalogo");
  return { success: true };
}

export async function adminRestoreListingAction(listingId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("publicaciones", "delete");
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  await restoreListing(listingId);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.restore",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { deletedAt: before.deletedAt }, after: { deletedAt: null } },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  return { success: true };
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPermission, requireSuperAdminRole } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import {
  adminDeleteListingImage,
  adminSetListingStatus,
  adminUpdateListing,
  getListingForAdminDetail,
  restoreListing,
  softDeleteListing,
  suspendListing,
  TaxonomyPendingError,
  unsuspendListing,
  validateAndActivateListing,
} from "@/server/data/admin/listings";
import {
  AccountSuspendedError,
  attachListingImages,
  ImageMismatchError,
  QuotaExceededError,
  reorderListingImages,
} from "@/server/data/listings";
import { updateListingSchema } from "@/lib/validations/listing";
import { uploadListingImage } from "@/lib/supabase-storage";
import { validateImageFile } from "@/lib/image-validation";
import type { ListingActionState } from "@/server/actions/listing.actions";
import type { ListingStatus } from "@/generated/prisma/client";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

const MAX_IMAGES = 6;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function getImageFiles(formData: FormData) {
  return formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

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

/**
 * "Validar datos" — paso SEPARADO de aprobar la solicitud de catálogo/
 * ubicación (`/admin/vehiculos/pendientes`, `/admin/ubicacion/pendientes`),
 * a propósito: recién acá se revisa la publicación puntual, pasa a ACTIVE y
 * se descuenta 1 cupo del dueño (ver `validateAndActivateListing` en
 * `server/data/admin/listings.ts`, que reusa `buildActivationEffect`).
 */
export async function validateAndActivateListingAction(listingId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("publicaciones", "edit");
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  try {
    await validateAndActivateListing(listingId);
  } catch (error) {
    if (error instanceof QuotaExceededError || error instanceof AccountSuspendedError || error instanceof TaxonomyPendingError) {
      return { error: error.message };
    }
    if (error instanceof Error) return { error: error.message };
    throw error;
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "listing.setStatus",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { status: before.status }, after: { status: "ACTIVE" } },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath("/catalogo");
  return { success: true };
}

/** "Pausar" pide motivo obligatorio, a diferencia de "Marcar Activa"/"Marcar Vendida" (`adminSetListingStatusAction`) — mismo criterio que "Quitar destacado"/pagos en efectivo: queda solo en el registro de auditoría, no se le muestra al dueño. */
export async function adminPauseListingAction(listingId: string, reason: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("publicaciones", "edit");
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 3) return { error: "Contanos el motivo de la pausa." };
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  await adminSetListingStatus(listingId, "PAUSADA");
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.pause",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { status: before.status }, after: { status: "PAUSADA", reason: trimmedReason } },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath("/catalogo");
  revalidatePath("/dashboard/publicaciones");
  return { success: true };
}

export async function adminSoftDeleteListingAction(listingId: string, reason: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("publicaciones", "delete");
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 3) return { error: "Contanos el motivo de la baja." };
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  await softDeleteListing(listingId);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.softDelete",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { deletedAt: before.deletedAt }, after: { deletedAt: new Date(), reason: trimmedReason } },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath("/catalogo");
  return { success: true };
}

export async function adminSuspendListingAction(listingId: string, days: number, reason: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("publicaciones", "edit");
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  const listing = await suspendListing(listingId, days, reason);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.suspend",
    targetTable: "Listing",
    targetId: listingId,
    changes: {
      before: { suspendedUntil: before.suspendedUntil, suspensionReason: before.suspensionReason },
      after: { suspendedUntil: listing.suspendedUntil, suspensionReason: listing.suspensionReason },
    },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath("/catalogo");
  revalidatePath("/dashboard/publicaciones");
  return { success: true };
}

export async function adminUnsuspendListingAction(listingId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("publicaciones", "edit");
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  await unsuspendListing(listingId);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.unsuspend",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { suspendedUntil: before.suspendedUntil }, after: { suspendedUntil: null } },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath("/catalogo");
  revalidatePath("/dashboard/publicaciones");
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

/**
 * Wizard completo (todas las etapas + fotos) para que un SUPERADMIN edite
 * cualquier publicación — a diferencia de `adminUpdateListingAction`
 * (editor básico sin fotos, disponible también para EDITOR), esta acción
 * es exclusiva de SUPERADMIN. Reusa `adminUpdateListing` (no toca
 * cupo/activationCount/expiresAt — no es una republicación) y el mismo
 * pipeline de subida de fotos que usa el dueño (`uploadListingImage`/
 * `attachListingImages`, ninguno de los dos depende de quién es el dueño).
 * Devuelve `ListingActionState` (no `AdminActionState`): es la misma forma
 * que espera `ListingForm`, y en éxito redirige en vez de devolver `success`
 * — igual que `updateListingAction` del dueño.
 */
export async function adminUpdateListingFullAction(
  listingId: string,
  _prevState: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  const session = await requireAdminPermission("publicaciones", "edit");
  requireSuperAdminRole(session.user.adminRole);
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  const raw = Object.fromEntries(formData);
  const parsed = updateListingSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const files = getImageFiles(formData);
  if (files.length > 0) {
    if (files.length > MAX_IMAGES) return { error: `Máximo ${MAX_IMAGES} fotos por publicación.` };
    for (const file of files) {
      const error = validateImageFile(file, MAX_FILE_SIZE_BYTES);
      if (error) return { error };
    }
  }

  await adminUpdateListing(listingId, parsed.data);
  if (files.length > 0) {
    const urls = await Promise.all(files.map((file, index) => uploadListingImage(file, listingId, index)));
    await attachListingImages(listingId, urls);
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "listing.update",
    targetTable: "Listing",
    targetId: listingId,
    changes: {
      before: {
        version: before.version,
        condition: before.condition,
        transmission: before.transmission,
        description: before.description,
        price: Number(before.price),
        currency: before.currency,
        priceNegotiable: before.priceNegotiable,
        acceptsTrade: before.acceptsTrade,
        acceptsFinancing: before.acceptsFinancing,
        mileageKm: before.mileageKm,
        city: before.city,
        province: before.province,
        contactAddress: before.contactAddress,
      },
      after: parsed.data,
    },
  });

  revalidatePath("/admin/publicaciones");
  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath(`/catalogo/${before.slug}`);
  redirect(`/admin/publicaciones/${listingId}`);
}

/** Borrar una foto desde el wizard de admin — motivo obligatorio (moderación de contenido), sin la regla de "al menos una foto" que tiene el dueño. Exclusivo SUPERADMIN. */
export async function adminDeleteListingImageAction(
  listingId: string,
  imageId: string,
  reason?: string
): Promise<ListingActionState> {
  const session = await requireAdminPermission("publicaciones", "edit");
  requireSuperAdminRole(session.user.adminRole);
  const trimmedReason = (reason ?? "").trim();
  if (trimmedReason.length < 3) return { error: "Contanos el motivo de la eliminación." };

  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };
  const deletedImage = before.images.find((img) => img.id === imageId);

  await adminDeleteListingImage(listingId, imageId);
  await logAdminAction({
    adminId: session.user.id,
    action: "listing.deleteImage",
    targetTable: "Listing",
    targetId: listingId,
    changes: { before: { imageUrl: deletedImage?.url ?? null }, after: { reason: trimmedReason } },
  });

  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath(`/admin/publicaciones/${listingId}/editar`);
  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/${before.slug}`);
}

/** Reordenar fotos desde el wizard de admin — reusa `reorderListingImages` (dueño) pasando el `userId` real del dueño, así el chequeo de ownership pasa trivialmente sin tener que duplicar la validación de integridad (misma cantidad/IDs). Exclusivo SUPERADMIN. */
export async function adminReorderListingImagesAction(
  listingId: string,
  orderedImageIds: string[]
): Promise<ListingActionState> {
  const session = await requireAdminPermission("publicaciones", "edit");
  requireSuperAdminRole(session.user.adminRole);
  const before = await getListingForAdminDetail(listingId);
  if (!before) return { error: "Publicación no encontrada." };

  try {
    await reorderListingImages(listingId, orderedImageIds, before.user.id);
  } catch (error) {
    if (error instanceof ImageMismatchError) return { error: error.message };
    throw error;
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "listing.reorderImages",
    targetTable: "Listing",
    targetId: listingId,
    changes: { after: { orderedImageIds } },
  });

  revalidatePath(`/admin/publicaciones/${listingId}`);
  revalidatePath(`/admin/publicaciones/${listingId}/editar`);
  revalidatePath("/catalogo");
}

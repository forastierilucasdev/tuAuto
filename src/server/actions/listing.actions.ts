"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createListingSchema, markSoldSchema, updateListingSchema } from "@/lib/validations/listing";
import { uploadListingImage } from "@/lib/supabase-storage";
import { validateImageFile } from "@/lib/image-validation";
import {
  attachListingImages,
  createListing,
  deleteListingImage,
  deleteOwnedListing,
  LastImageError,
  markListingAsSold,
  QuotaExceededError,
  reactivateListing,
  setListingPauseStatus,
  updateOwnedListing,
} from "@/server/data/listings";

export type ListingActionState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

const MAX_IMAGES = 6;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function getImageFiles(formData: FormData) {
  return formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function validateImages(files: File[]): string | null {
  if (files.length === 0) return "Subí al menos una foto del vehículo.";
  if (files.length > MAX_IMAGES) return `Máximo ${MAX_IMAGES} fotos por publicación.`;
  for (const file of files) {
    const error = validateImageFile(file, MAX_FILE_SIZE_BYTES);
    if (error) return error;
  }
  return null;
}

export async function createListingAction(
  _prevState: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const raw = Object.fromEntries(formData);
  const parsed = createListingSchema.safeParse({
    vehicleType: raw.vehicleType,
    brandSlug: raw.brandSlug,
    modelSlug: raw.modelSlug,
    year: raw.year,
    version: raw.version || undefined,
    condition: raw.condition,
    transmission: raw.transmission || undefined,
    description: raw.description || undefined,
    price: raw.price,
    currency: raw.currency,
    priceNegotiable: raw.priceNegotiable,
    acceptsTrade: raw.acceptsTrade,
    acceptsFinancing: raw.acceptsFinancing,
    mileageKm: raw.mileageKm || undefined,
    city: raw.city || undefined,
    province: raw.province || undefined,
    contactAddress: raw.contactAddress || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  // El orden de "images" ya viene con la foto de portada primero (ver
  // ListingForm): se conserva ese orden al guardar (order = índice).
  const files = getImageFiles(formData);
  const imageError = validateImages(files);
  if (imageError) return { error: imageError };

  const asDraft = raw.status === "DRAFT";
  let listing;
  try {
    listing = await createListing({ userId: session.user.id, asDraft, ...parsed.data });
  } catch (error) {
    if (error instanceof QuotaExceededError) return { error: error.message };
    throw error;
  }

  const urls = await Promise.all(files.map((file, index) => uploadListingImage(file, listing.id, index)));
  await attachListingImages(listing.id, urls);

  revalidatePath("/dashboard/publicaciones");
  revalidatePath("/catalogo");
  redirect(
    asDraft ? "/dashboard/publicaciones?tab=inactivas" : `/dashboard/publicaciones?published=${listing.slug}`
  );
}

export async function updateListingAction(
  _prevState: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) return { error: "Publicación inválida." };

  const raw = Object.fromEntries(formData);
  const parsed = updateListingSchema.safeParse({
    version: raw.version || undefined,
    condition: raw.condition,
    transmission: raw.transmission || undefined,
    description: raw.description || undefined,
    price: raw.price,
    currency: raw.currency,
    priceNegotiable: raw.priceNegotiable,
    acceptsTrade: raw.acceptsTrade,
    acceptsFinancing: raw.acceptsFinancing,
    mileageKm: raw.mileageKm || undefined,
    city: raw.city || undefined,
    province: raw.province || undefined,
    contactAddress: raw.contactAddress || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const files = getImageFiles(formData);
  if (files.length > 0) {
    const imageError = validateImages(files);
    if (imageError) return { error: imageError };
  }

  let updatedSlug: string;
  let reactivated: boolean;
  try {
    const updated = await updateOwnedListing(listingId, session.user.id, parsed.data);
    updatedSlug = updated.listing.slug;
    reactivated = updated.reactivated;

    if (files.length > 0) {
      const urls = await Promise.all(files.map((file, index) => uploadListingImage(file, listingId, index)));
      await attachListingImages(listingId, urls);
    }
  } catch (error) {
    if (error instanceof QuotaExceededError) return { error: error.message };
    return { error: "No pudimos actualizar la publicación." };
  }

  revalidatePath("/dashboard/publicaciones");
  revalidatePath(`/catalogo/${updatedSlug}`);
  redirect(reactivated ? `/dashboard/publicaciones?published=${updatedSlug}` : "/dashboard/publicaciones");
}

export type MarkSoldState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

/**
 * Se llama directo desde el cliente (no como `<form action>`) para poder
 * mostrar errores de validación y cerrar el modal recién si sale bien —
 * evita el mismo problema de carrera que tenía "Pausar" (ver ERRORES.md).
 */
export async function markListingSoldAction(listingId: string, formData: FormData): Promise<MarkSoldState> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!listingId) return { error: "Publicación inválida." };

  const raw = Object.fromEntries(formData);
  const parsed = markSoldSchema.safeParse({
    soldAt: raw.soldAt || undefined,
    buyerInfo: raw.buyerInfo || undefined,
    realSalePrice: raw.realSalePrice || undefined,
    saleConditions: raw.saleConditions || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await markListingAsSold(listingId, session.user.id, parsed.data);
  revalidatePath("/dashboard/publicaciones");
  revalidatePath("/catalogo");
}

export async function pauseListingAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const listingId = String(formData.get("listingId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!listingId || (status !== "RESERVADA" && status !== "PAUSADA")) return;

  await setListingPauseStatus(listingId, session.user.id, status);
  revalidatePath("/dashboard/publicaciones");
  revalidatePath("/catalogo");
}

export type ReactivateListingState = { error?: string; slug?: string } | undefined;

/** "No, publicar" al reactivar — sin pasar por el formulario de edición. */
export async function reactivateListingAction(listingId: string): Promise<ReactivateListingState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let listing;
  try {
    listing = await reactivateListing(listingId, session.user.id);
  } catch (error) {
    if (error instanceof QuotaExceededError) return { error: error.message };
    throw error;
  }

  revalidatePath("/dashboard/publicaciones");
  revalidatePath("/catalogo");
  return { slug: listing.slug };
}

export type DeleteImageState = { error?: string } | undefined;

export async function deleteListingImageAction(listingId: string, imageId: string): Promise<DeleteImageState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    await deleteListingImage(listingId, imageId, session.user.id);
  } catch (error) {
    if (error instanceof LastImageError) return { error: error.message };
    throw error;
  }

  revalidatePath("/dashboard/publicaciones");
  revalidatePath(`/dashboard/publicaciones/${listingId}/editar`);
}

export async function deleteListingAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) return;

  await deleteOwnedListing(listingId, session.user.id);
  revalidatePath("/dashboard/publicaciones");
  revalidatePath("/catalogo");
}

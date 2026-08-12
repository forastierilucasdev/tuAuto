"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/server/auth-helpers";
import {
  purchaseFeatureByDays,
  purchaseFeatureCombo,
  purchasePublicationPack,
  purchaseSubscription,
} from "@/server/data/payments";

/** `<form action>`: crea el pago pendiente + la preferencia y redirige al checkout de Mercado Pago. */
export async function purchaseSubscriptionAction(formData: FormData) {
  const session = await requireSession();

  const planCode = String(formData.get("planCode") ?? "");
  if (!planCode) return;

  const redirectUrl = await purchaseSubscription(session.user.id, planCode);
  redirect(redirectUrl);
}

/** `<form action>`: crea el pago pendiente + la preferencia y redirige al checkout de Mercado Pago. */
export async function purchasePublicationPackAction(formData: FormData) {
  const session = await requireSession();

  const planCode = String(formData.get("planCode") ?? "");
  if (!planCode) return;

  const redirectUrl = await purchasePublicationPack(session.user.id, planCode);
  redirect(redirectUrl);
}

export type PurchaseFeatureState = { error: string } | { redirectUrl: string } | undefined;

/**
 * "Destacar publicación por día" — invocada directo desde el cliente (no
 * `<form action>`) para poder mandar un array de líneas del carrito; por eso
 * NO puede usar `redirect()` acá (mismo bug ya documentado y resuelto en
 * Fase 21/ERRORES.md: `redirect()` dentro de una Server Action invocada
 * directo desde el cliente no resuelve la promesa del lado del cliente).
 * Devuelve la URL de Mercado Pago y el cliente navega con
 * `window.location.href`.
 */
export async function purchaseFeatureByDaysAction(
  items: { listingId: string; days: number }[]
): Promise<PurchaseFeatureState> {
  const session = await requireSession();

  try {
    const redirectUrl = await purchaseFeatureByDays(session.user.id, items);
    return { redirectUrl };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
}

/** "Publicación 30 días + 7 días destacado" — wizard con 2 ramas, ver `purchaseFeatureCombo`. Mismo motivo que arriba: no usa `redirect()`. */
export async function purchaseFeatureComboAction(
  choice: { listingId: string } | { forNextListing: true }
): Promise<PurchaseFeatureState> {
  const session = await requireSession();

  try {
    const redirectUrl = await purchaseFeatureCombo(session.user.id, choice);
    return { redirectUrl };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
}

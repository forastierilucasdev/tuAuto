"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addPaymentMethod,
  purchaseFeatureByDays,
  purchaseFeatureCombo,
  purchasePublicationPack,
  purchaseSubscription,
} from "@/server/data/payments";

export type PaymentActionState = { error?: string; success?: boolean } | undefined;

export async function addPaymentMethodAction(
  _prevState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Tenés que iniciar sesión." };

  const label = String(formData.get("label") ?? "").trim();
  if (label.length < 3) {
    return { error: "Ingresá un alias válido (mínimo 3 caracteres)." };
  }

  await addPaymentMethod(session.user.id, label);
  revalidatePath("/dashboard/pago");
  return { success: true };
}

function revalidateAfterPurchase() {
  revalidatePath("/dashboard/anuncios");
  revalidatePath("/dashboard/compra");
  revalidatePath("/dashboard/compra/historial");
  revalidatePath("/dashboard/publicaciones");
  revalidatePath("/catalogo");
}

export async function purchaseSubscriptionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const planCode = String(formData.get("planCode") ?? "");
  if (!planCode) return;

  await purchaseSubscription(session.user.id, planCode);
  revalidateAfterPurchase();
}

export async function purchasePublicationPackAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const planCode = String(formData.get("planCode") ?? "");
  if (!planCode) return;

  await purchasePublicationPack(session.user.id, planCode);
  revalidateAfterPurchase();
}

export type PurchaseFeatureState = { error?: string } | undefined;

/**
 * "Destacar publicación por día" — invocada directo desde el cliente (no
 * `<form action>`) para poder mandar un array de líneas del carrito; por eso
 * devuelve estado en vez de redirigir (mismo motivo que `reactivateListingAction`).
 */
export async function purchaseFeatureByDaysAction(
  items: { listingId: string; days: number }[]
): Promise<PurchaseFeatureState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    await purchaseFeatureByDays(session.user.id, items);
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }

  revalidateAfterPurchase();
  return undefined;
}

/** "Publicación 30 días + 7 días destacado" — wizard con 2 ramas, ver `purchaseFeatureCombo`. */
export async function purchaseFeatureComboAction(
  choice: { listingId: string } | { forNextListing: true }
): Promise<PurchaseFeatureState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    await purchaseFeatureCombo(session.user.id, choice);
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }

  revalidateAfterPurchase();
  return undefined;
}

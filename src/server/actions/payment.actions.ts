"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addPaymentMethod,
  purchaseFeaturePlan,
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

/**
 * Usada desde la pantalla dedicada "Destacar anuncio" (por publicación) —
 * al pagar, vuelve a "Mis publicaciones" en la pestaña Destacadas para
 * mostrar el resultado.
 */
export async function payListingFeatureAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const planCode = String(formData.get("planCode") ?? "");
  const listingId = String(formData.get("listingId") ?? "");
  if (!planCode || !listingId) return;

  await purchaseFeaturePlan(session.user.id, planCode, listingId);

  revalidatePath("/dashboard/pago");
  revalidatePath("/dashboard/publicaciones");
  revalidatePath("/catalogo");
  redirect("/dashboard/publicaciones?tab=destacadas");
}

export async function purchaseSubscriptionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const planCode = String(formData.get("planCode") ?? "");
  if (!planCode) return;

  await purchaseSubscription(session.user.id, planCode);
  revalidatePath("/dashboard/pago");
}

export async function purchasePublicationPackAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const planCode = String(formData.get("planCode") ?? "");
  if (!planCode) return;

  await purchasePublicationPack(session.user.id, planCode);
  revalidatePath("/dashboard/pago");
  revalidatePath("/dashboard/publicaciones");
}

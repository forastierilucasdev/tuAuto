import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getMercadoPagoPayment, verifyMercadoPagoSignature } from "@/lib/mercadopago";
import { applyPaymentEffect, getPaymentById, markPaymentRejected } from "@/server/data/payments";
import { Prisma } from "@/generated/prisma/client";

function revalidateAfterPurchase() {
  revalidatePath("/dashboard/anuncios");
  revalidatePath("/dashboard/compra");
  revalidatePath("/dashboard/compra/historial");
  revalidatePath("/dashboard/publicaciones");
  revalidatePath("/catalogo");
}

/**
 * Notificación de Mercado Pago (Checkout Pro) — nunca confía en los datos
 * del body, siempre vuelve a pedirle el pago real a la API por ID. Idempotente:
 * `applyPaymentEffect`/`markPaymentRejected` chequean `status === "PENDING"`
 * antes de tocar nada, y el `@unique` en `Payment.providerPaymentId` es el
 * backstop si dos notificaciones llegan en paralelo.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let topic = url.searchParams.get("type") ?? url.searchParams.get("topic");
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  const body = await request.json().catch(() => null);
  if (body && typeof body === "object") {
    topic = body.type ?? topic;
    paymentId = body.data?.id ?? paymentId;
  }

  // Mercado Pago también manda notificaciones de "merchant_order" u otros
  // tópicos — solo nos importa "payment", el resto se ignora con 200.
  if (topic !== "payment" || !paymentId) {
    return NextResponse.json({ received: true });
  }

  const isValidSignature = verifyMercadoPagoSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId: paymentId,
  });
  if (!isValidSignature) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  // Un ID inexistente/inválido (ej. una notificación de prueba, o basura
  // apuntada directo al endpoint) no debería generar reintentos infinitos de
  // Mercado Pago — se responde 200 igual y se loguea.
  const mpPayment = await getMercadoPagoPayment(paymentId).catch((error) => {
    console.warn(`[mercadopago] No se pudo obtener el pago ${paymentId}:`, error);
    return null;
  });
  if (!mpPayment) return NextResponse.json({ received: true });

  const externalReference = mpPayment.external_reference;
  if (!externalReference) return NextResponse.json({ received: true });

  const localPayment = await getPaymentById(externalReference);
  if (!localPayment) return NextResponse.json({ received: true });

  const providerPaymentId = String(mpPayment.id);

  try {
    if (mpPayment.status === "approved") {
      await applyPaymentEffect(localPayment.id, providerPaymentId);
      revalidateAfterPurchase();
    } else if (mpPayment.status === "rejected" || mpPayment.status === "cancelled") {
      await markPaymentRejected(localPayment.id, providerPaymentId);
    }
    // pending / in_process / etc.: no-op, va a llegar otra notificación
    // cuando el estado cambie.
  } catch (error) {
    // Dos notificaciones concurrentes para el mismo pago: la segunda pisa el
    // mismo `providerPaymentId` (único) y falla acá — ya está procesado, no
    // es un error real.
    const isDuplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!isDuplicate) throw error;
  }

  return NextResponse.json({ received: true });
}

// El formato IPN clásico de Mercado Pago puede llegar por GET con los datos
// en query params (`?topic=payment&id=...`) en vez de POST con body.
export async function GET(request: Request) {
  return POST(request);
}

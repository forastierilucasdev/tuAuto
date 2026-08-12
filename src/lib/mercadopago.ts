import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { MercadoPagoConfig, Payment as MercadoPagoPayment, Preference } from "mercadopago";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });

/**
 * URL absoluta del sitio, armada desde el header `host` del request en vez
 * de un env var fijo — evita que `back_urls`/`notification_url` queden mal
 * configuradas al pasar de dev a preview a producción (mismo criterio que
 * `getClientIp` en `lib/rate-limit.ts`).
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${isLocal ? "http" : "https"}://${host}`;
}

export type MercadoPagoItem = { id: string; title: string; unitPrice: number };

/**
 * Crea una preferencia de Checkout Pro y devuelve la URL a la que redirigir
 * al comprador. `externalReference` es el `Payment.id` local — es lo único
 * que usa el webhook para encontrar el pago pendiente cuando Mercado Pago
 * confirme el estado real (nunca se acredita nada acá).
 */
export async function createMercadoPagoPreference({
  items,
  externalReference,
}: {
  items: MercadoPagoItem[];
  externalReference: string;
}): Promise<string> {
  const baseUrl = await getBaseUrl();
  // Mercado Pago rechaza la preferencia entera ("auto_return invalid") si
  // `back_urls.success` no es una URL https válida — en dev (`http://localhost`)
  // se arma igual el checkout, pero sin auto-retorno (el comprador vuelve
  // tocando el botón de MP en vez de que redirija solo).
  const canAutoReturn = baseUrl.startsWith("https://");

  const preference = await new Preference(mpClient).create({
    body: {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: 1,
        currency_id: "ARS",
        unit_price: item.unitPrice,
      })),
      external_reference: externalReference,
      back_urls: {
        success: `${baseUrl}/dashboard/compra/resultado?estado=success`,
        pending: `${baseUrl}/dashboard/compra/resultado?estado=pending`,
        failure: `${baseUrl}/dashboard/compra/resultado?estado=failure`,
      },
      ...(canAutoReturn ? { auto_return: "approved" as const } : {}),
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
    },
  });

  // Con credenciales de prueba, Mercado Pago también devuelve
  // `sandbox_init_point` — se prioriza ese si viene.
  const url = preference.sandbox_init_point ?? preference.init_point;
  if (!url) throw new Error("Mercado Pago no devolvió una URL de checkout.");
  return url;
}

/** Vuelve a pedirle el pago a Mercado Pago por ID — el webhook nunca confía en los datos que manda la notificación. */
export async function getMercadoPagoPayment(paymentId: string) {
  return new MercadoPagoPayment(mpClient).get({ id: paymentId });
}

/**
 * Valida el header `x-signature` de una notificación de webhook contra
 * `MERCADOPAGO_WEBHOOK_SECRET` (algoritmo documentado por Mercado Pago:
 * HMAC-SHA256 sobre un manifest `id:{dataId};request-id:{xRequestId};ts:{ts};`).
 * Si no hay secret configurado todavía (falta cargarlo desde el panel), se
 * omite la validación con un warning — mismo criterio que el fallback de
 * Upstash en `rate-limit.ts`.
 */
export function verifyMercadoPagoSignature({
  xSignature,
  xRequestId,
  dataId,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[mercadopago] MERCADOPAGO_WEBHOOK_SECRET no configurado — se omite la validación de firma del webhook."
    );
    return true;
  }
  if (!xSignature) return false;

  const parts: Record<string, string> = {};
  for (const pair of xSignature.split(",")) {
    const [key, value] = pair.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId ?? ""};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const hashBuf = Buffer.from(hash, "hex");
  if (expectedBuf.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, hashBuf);
}

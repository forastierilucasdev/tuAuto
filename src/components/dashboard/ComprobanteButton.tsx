"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { Currency } from "@/generated/prisma/client";

type ComprobanteData = {
  description: string;
  amount: number;
  currency: Currency;
  createdAt: Date;
  providerPaymentId: string | null;
  planCode: string;
  listingTitle: string | null;
  buyerName: string;
  buyerEmail: string;
  provider: string;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

/** Categoría legible a partir del código de plan — mismos prefijos que usa `applyPaymentEffect` en `server/data/payments.ts`. */
function tipoDeAnuncio(planCode: string): string {
  if (planCode === "FEATURE_PER_DAY") return "Destacar publicación por día";
  if (planCode === "PUBLICATION_30D_FEATURED_7D") return "Publicación 30 días + destacado";
  if (planCode.startsWith("SUBSCRIPTION_")) return "Suscripción";
  if (planCode.startsWith("PUBLICATIONS_PACK_")) return "Publicación";
  return "Otro";
}

/** Medio de pago legible — `provider` es un string libre (`"mercadopago"` de siempre, `"admin"`/`"admin_cash"` para lo otorgado o aprobado a mano desde el panel). */
function medioDePago(provider: string): string {
  if (provider === "mercadopago") return "Mercado Pago";
  if (provider === "admin_cash") return "Efectivo (registrado por administración)";
  if (provider === "admin") return "Otorgado por administración";
  return provider;
}

/**
 * Resumen propio del pago (no es una factura legal — para eso hace falta
 * facturación electrónica AFIP, un proyecto aparte). El comprobante oficial
 * de la transacción lo sigue teniendo el comprador en su cuenta de Mercado
 * Pago; esto es solo para no tener que salir de Motoresya a buscarlo.
 */
export function ComprobanteButton({ payment }: { payment: ComprobanteData }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <FileText className="h-4 w-4" />
        Ver comprobante
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Comprobante de pago">
        <dl className="text-sm">
          <Row label="Operación" value={payment.providerPaymentId ?? "—"} />
          <Row label="Comprador" value={payment.buyerName} />
          <Row label="Correo" value={payment.buyerEmail} />
          <Row label="Tipo de anuncio" value={tipoDeAnuncio(payment.planCode)} />
          {payment.listingTitle && <Row label="Publicación" value={payment.listingTitle} />}
          <Row label="Descripción" value={payment.description} />
          <Row label="Fecha" value={payment.createdAt.toLocaleDateString("es-AR")} />
          <Row label="Hora" value={payment.createdAt.toLocaleTimeString("es-AR")} />
          <Row label="Medio de pago" value={medioDePago(payment.provider)} />
          <Row label="Estado" value="Aprobado" />
        </dl>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-navy">Total</span>
          <span className="text-lg font-bold text-navy">{formatCurrency(payment.amount, payment.currency)}</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {payment.provider === "mercadopago"
            ? "Este es un resumen de Motoresya, no una factura — el comprobante oficial de Mercado Pago está disponible en tu cuenta de Mercado Pago."
            : "Este es un resumen de Motoresya, no una factura."}
        </p>
        <div className="mt-4 flex justify-end">
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </>
  );
}

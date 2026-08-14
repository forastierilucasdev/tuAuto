"use client";

import { useRouter } from "next/navigation";
import { ReasonConfirmModal } from "@/components/admin/ReasonConfirmModal";
import { ComprobanteButton } from "@/components/dashboard/ComprobanteButton";
import { approveCashPaymentAction } from "@/server/actions/admin/subscriptions.actions";
import type { Currency, PaymentStatus } from "@/generated/prisma/client";

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

export function PaymentRowActions({
  paymentId,
  status,
  canEdit,
  comprobante,
}: {
  paymentId: string;
  status: PaymentStatus;
  canEdit: boolean;
  comprobante: ComprobanteData;
}) {
  const router = useRouter();

  if (status === "PENDING") {
    return (
      <ReasonConfirmModal
        label="Aprobar (efectivo)"
        confirmLabel="Aprobar pago"
        variant="success"
        disabled={!canEdit}
        description="Marca el pago como aprobado y acredita lo que corresponda (cupo, suscripción o destacado) igual que si lo hubiera confirmado Mercado Pago. Usalo solo si la persona pagó en efectivo o por fuera de la plataforma."
        onConfirm={(reason) => approveCashPaymentAction(paymentId, reason)}
        onSuccess={() => router.refresh()}
      />
    );
  }

  if (status === "APPROVED") {
    return <ComprobanteButton payment={comprobante} />;
  }

  return <span className="text-muted-foreground">—</span>;
}

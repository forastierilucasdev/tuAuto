import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { ComprobanteButton } from "@/components/dashboard/ComprobanteButton";
import { getPaymentHistory } from "@/server/data/payments";
import { getFullProfile } from "@/server/data/users";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Historial de pagos" };

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Aprobado",
  PENDING: "Pendiente",
  REJECTED: "Rechazado",
};

export default async function HistorialDePagosPage() {
  const session = await auth();
  const [history, profile] = await Promise.all([
    getPaymentHistory(session!.user.id),
    getFullProfile(session!.user.id),
  ]);
  const buyerName = profile?.fullName ?? session!.user.name ?? "";
  const buyerEmail = profile?.email ?? session!.user.email ?? "";

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/dashboard/compra" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Historial de pagos</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Pagos procesados con Mercado Pago.</p>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hiciste ningún pago.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3">{payment.description}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(payment.amount), payment.currency)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        payment.status === "APPROVED" ? "success" : payment.status === "REJECTED" ? "danger" : "default"
                      }
                    >
                      {STATUS_LABEL[payment.status] ?? payment.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{payment.createdAt.toLocaleDateString("es-AR")}</td>
                  <td className="px-4 py-3">
                    {payment.status === "APPROVED" ? (
                      <ComprobanteButton
                        payment={{
                          description: payment.description,
                          amount: Number(payment.amount),
                          currency: payment.currency,
                          createdAt: payment.createdAt,
                          providerPaymentId: payment.providerPaymentId,
                          planCode: payment.planCode,
                          listingTitle: payment.listing?.title ?? null,
                          buyerName,
                          buyerEmail,
                          provider: payment.provider,
                        }}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

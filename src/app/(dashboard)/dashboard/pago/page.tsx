import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import {
  getActivePlans,
  getFeaturableListings,
  getPaymentHistory,
  getPaymentMethods,
} from "@/server/data/payments";
import { purchaseFeaturePlanAction, purchaseSubscriptionAction } from "@/server/actions/payment.actions";
import { AddPaymentMethodForm } from "@/components/forms/AddPaymentMethodForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { isBusinessAccountType } from "@/lib/constants";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Método de pago" };

export default async function PagoPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isAgency = isBusinessAccountType(session!.user.accountType);

  const [methods, plans, listings, history] = await Promise.all([
    getPaymentMethods(userId),
    getActivePlans(),
    getFeaturableListings(userId),
    getPaymentHistory(userId),
  ]);

  const featurePlans = plans.filter((p) => p.code.startsWith("FEATURE_"));
  const subscriptionPlans = plans.filter((p) => p.code.startsWith("AGENCY_"));

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Método de pago</h1>
          <p className="mt-1 text-muted-foreground">
            Pagá para destacar tus publicaciones o suscribirte. Esta sección funciona con datos
            simulados — la integración real con Mercado Pago todavía está pendiente (ver
            ARCHITECTURE.md).
          </p>
        </div>
        <BackButton />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-navy">Métodos guardados</h2>
        {methods.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {methods.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">Mercado Pago</p>
              </div>
            ))}
          </div>
        )}
        <div className="max-w-sm">
          <AddPaymentMethodForm />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-navy">Destacar una publicación</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tenés publicaciones activas disponibles para destacar en este momento.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {featurePlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="mt-1 text-2xl font-extrabold text-primary">
                    {formatCurrency(Number(plan.price))}
                  </p>
                </CardHeader>
                <CardContent>
                  <form action={purchaseFeaturePlanAction} className="space-y-3">
                    <input type="hidden" name="planCode" value={plan.code} />
                    <Select name="listingId" required defaultValue="">
                      <option value="" disabled>
                        Elegí una publicación
                      </option>
                      {listings.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" className="w-full">
                      Pagar y destacar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {isAgency && subscriptionPlans.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-navy">Suscripción de concesionaria</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="mt-1 text-2xl font-extrabold text-primary">
                    {formatCurrency(Number(plan.price))}
                  </p>
                </CardHeader>
                <CardContent>
                  <form action={purchaseSubscriptionAction}>
                    <input type="hidden" name="planCode" value={plan.code} />
                    <Button type="submit" className="w-full">
                      Contratar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-bold text-navy">Historial de pagos</h2>
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
                          payment.status === "APPROVED"
                            ? "success"
                            : payment.status === "REJECTED"
                              ? "danger"
                              : "default"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{payment.createdAt.toLocaleDateString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

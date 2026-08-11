import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { AnunciosSubNav } from "@/components/dashboard/AnunciosSubNav";
import { FeatureComboWizard } from "@/components/dashboard/FeatureComboWizard";
import { DestacarPorDiasCarrito } from "@/components/dashboard/DestacarPorDiasCarrito";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getFeaturableListings } from "@/server/data/listings";
import {
  getPaymentHistory,
  getPlanByCode,
  getPublicationPackPlans,
  getSubscriptionPlans,
  getSubscriptionStatus,
} from "@/server/data/payments";
import { purchasePublicationPackAction, purchaseSubscriptionAction } from "@/server/actions/payment.actions";
import { daysRemaining, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis compras" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function MisComprasPage(props: PageProps<"/dashboard/compra">) {
  const sp = await props.searchParams;
  const destacarListingId = param(sp, "destacar");

  const session = await auth();
  const userId = session!.user.id;

  const [packPlans, comboPlan, perDayPlan, featurableListings, subscriptionPlans, subscriptionStatus, history] =
    await Promise.all([
      getPublicationPackPlans(),
      getPlanByCode("PUBLICATION_30D_FEATURED_7D"),
      getPlanByCode("FEATURE_PER_DAY"),
      getFeaturableListings(userId),
      getSubscriptionPlans(),
      getSubscriptionStatus(userId),
      getPaymentHistory(userId),
    ]);

  const singlePlan = packPlans.find((p) => p.code === "PUBLICATIONS_PACK_1");
  const featurableForCarrito = featurableListings.map((l) => ({
    id: l.id,
    title: l.title,
    maxDays: daysRemaining(l.expiresAt),
  }));

  return (
    <div>
      <div className="flex justify-end">
        <BackButton />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Mis compras</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Esta sección funciona con datos simulados — la integración real con Mercado Pago todavía está
        pendiente (ver ARCHITECTURE.md).
      </p>

      <AnunciosSubNav />

      {/* 3 columnas simétricas en desktop; en mobile se apilan y
          "Suscripciones" queda al final (orden explícito con `order-*`,
          no coincide con el orden natural del DOM/desktop). */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start">
        <section className="order-1 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-lg font-bold text-navy">Pago individual</h2>

          {singlePlan && (
            <Card>
              <CardHeader>
                <CardTitle>{singlePlan.name}</CardTitle>
                <p className="mt-1 text-2xl font-extrabold text-primary">{formatCurrency(Number(singlePlan.price))}</p>
              </CardHeader>
              <CardContent>
                <form action={purchasePublicationPackAction}>
                  <input type="hidden" name="planCode" value={singlePlan.code} />
                  <Button type="submit" className="w-full">
                    Comprar
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {comboPlan && (
            <Card>
              <CardHeader>
                <CardTitle>{comboPlan.name}</CardTitle>
                <p className="mt-1 text-2xl font-extrabold text-primary">{formatCurrency(Number(comboPlan.price))}</p>
              </CardHeader>
              <CardContent>
                <FeatureComboWizard listings={featurableListings.map((l) => ({ id: l.id, title: l.title }))} />
              </CardContent>
            </Card>
          )}

          {perDayPlan && (
            <Card>
              <CardHeader>
                <CardTitle>{perDayPlan.name}</CardTitle>
                <p className="mt-1 text-2xl font-extrabold text-primary">
                  {formatCurrency(Number(perDayPlan.price))}{" "}
                  <span className="text-sm font-medium text-muted-foreground">/ día</span>
                </p>
              </CardHeader>
              <CardContent>
                <DestacarPorDiasCarrito
                  listings={featurableForCarrito}
                  pricePerDay={Number(perDayPlan.price)}
                  preselectedListingId={destacarListingId}
                />
              </CardContent>
            </Card>
          )}
        </section>

        <section className="order-3 space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-card lg:order-2">
          <h2 className="text-lg font-bold text-navy">Suscripciones</h2>

          {subscriptionStatus.active && subscriptionStatus.expiresAt && (
            <div className="rounded-xl border border-primary/30 bg-surface p-3 text-sm">
              <p className="font-semibold text-foreground">
                Tenés {subscriptionStatus.quota} publicaciones activas hasta el{" "}
                {dateFormatter.format(subscriptionStatus.expiresAt)}.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Al vencer, las publicaciones que no reactivaste con cupo disponible pasan a Inactivas. Contratar una
                suscripción nueva reemplaza esta.
              </p>
            </div>
          )}

          {subscriptionPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="mt-1 text-2xl font-extrabold text-primary">{formatCurrency(Number(plan.price))}</p>
              </CardHeader>
              <CardContent>
                <form action={purchaseSubscriptionAction}>
                  <input type="hidden" name="planCode" value={plan.code} />
                  <Button type="submit" className="w-full">
                    Suscribirme
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="order-2 rounded-2xl border border-border bg-surface-muted p-5 shadow-card lg:order-3">
          <h2 className="mb-4 text-lg font-bold text-navy">Historial de pagos</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hiciste ningún pago.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
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
    </div>
  );
}

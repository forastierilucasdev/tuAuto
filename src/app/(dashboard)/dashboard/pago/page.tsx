import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getPaymentHistory,
  getPaymentMethods,
  getPublicationPackPlans,
  getActivePlans,
} from "@/server/data/payments";
import { getAvailablePublications, getOwnerListingGroups } from "@/server/data/listings";
import { purchasePublicationPackAction, purchaseSubscriptionAction } from "@/server/actions/payment.actions";
import { AddPaymentMethodForm } from "@/components/forms/AddPaymentMethodForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatKm } from "@/lib/utils";
import { isBusinessAccountType } from "@/lib/constants";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Método de pago" };

// A partir de este cupo recomendamos los packs más grandes para cuentas de
// negocio (Agencia/Concesionaria), que suelen publicar muchos más vehículos.
const RECOMMENDED_FOR_BUSINESS = new Set(["PUBLICATIONS_PACK_20"]);

export default async function PagoPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isAgency = isBusinessAccountType(session!.user.accountType);

  const [methods, plans, packPlans, available, groups, history] = await Promise.all([
    getPaymentMethods(userId),
    getActivePlans(),
    getPublicationPackPlans(),
    getAvailablePublications(userId),
    getOwnerListingGroups(userId),
    getPaymentHistory(userId),
  ]);

  const subscriptionPlans = plans.filter((p) => p.code.startsWith("AGENCY_"));
  const featuredListings = groups.destacadas;

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Método de pago</h1>
          <p className="mt-1 text-muted-foreground">
            Esta sección funciona con datos simulados — la integración real con Mercado Pago todavía está
            pendiente (ver ARCHITECTURE.md).
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

      <section id="comprar-publicaciones">
        <h2 className="mb-1 text-lg font-bold text-navy">Comprar publicaciones</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Publicaciones disponibles ahora: <span className="font-semibold text-foreground">{available}</span>.
          Comprá un pack para seguir publicando cuando se agoten.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packPlans.map((plan) => {
            const recommended = isAgency && RECOMMENDED_FOR_BUSINESS.has(plan.code);
            return (
              <Card key={plan.id} className={recommended ? "border-primary" : undefined}>
                <CardHeader>
                  {recommended && <Badge variant="primary">Recomendado para vos</Badge>}
                  <CardTitle className="mt-1">{plan.name}</CardTitle>
                  <p className="mt-1 text-2xl font-extrabold text-primary">{formatCurrency(Number(plan.price))}</p>
                </CardHeader>
                <CardContent>
                  <form action={purchasePublicationPackAction}>
                    <input type="hidden" name="planCode" value={plan.code} />
                    <Button type="submit" className="w-full">
                      Comprar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-bold text-navy">Anuncios destacados</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Tus publicaciones destacadas actualmente. Para destacar una nueva, entrá a ella desde &quot;Mis
          publicaciones&quot;.
        </p>
        {featuredListings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tenés publicaciones destacadas.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/catalogo/${listing.slug}`}
                className="flex gap-3 rounded-xl border border-border bg-surface p-3 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  <Image src={listing.imageUrl} alt={listing.title} fill sizes="96px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold text-navy">
                    <Star className="h-3.5 w-3.5 shrink-0 fill-current text-warning" />
                    {listing.title}
                  </p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(listing.price, listing.currency)}</p>
                  <p className="text-xs text-muted-foreground">{formatKm(listing.mileageKm)}</p>
                </div>
              </Link>
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

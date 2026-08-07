import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { AnunciosSubNav } from "@/components/dashboard/AnunciosSubNav";
import { FeatureComboWizard } from "@/components/dashboard/FeatureComboWizard";
import { DestacarPorDiasCarrito } from "@/components/dashboard/DestacarPorDiasCarrito";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getAvailablePublications, getFeaturableListings, getOwnerListingGroups } from "@/server/data/listings";
import {
  getPaymentHistory,
  getPendingFeaturedVouchers,
  getPlanByCode,
  getPublicationPackPlans,
  getSubscriptionPlans,
  getSubscriptionStatus,
} from "@/server/data/payments";
import { purchasePublicationPackAction, purchaseSubscriptionAction } from "@/server/actions/payment.actions";
import { getFullProfile } from "@/server/data/users";
import { cn, daysRemaining, formatCurrency, formatKm } from "@/lib/utils";
import { mileageUnitFor } from "@/lib/constants";

export const metadata: Metadata = { title: "Mis compras" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

const MODOS = [
  { key: "individual", label: "Pago individual" },
  { key: "suscripcion", label: "Suscripciones" },
] as const;

export default async function MisComprasPage(props: PageProps<"/dashboard/compra">) {
  const sp = await props.searchParams;
  const modo = param(sp, "modo") === "suscripcion" ? "suscripcion" : "individual";
  const destacarListingId = param(sp, "destacar");

  const session = await auth();
  const userId = session!.user.id;

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

      <div className="mb-6 flex gap-1 border-b border-border">
        {MODOS.map((m) => (
          <Link
            key={m.key}
            href={`/dashboard/compra?modo=${m.key}`}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              modo === m.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </Link>
        ))}
      </div>

      {modo === "individual" ? (
        <PagoIndividual userId={userId} destacarListingId={destacarListingId} />
      ) : (
        <Suscripciones userId={userId} />
      )}
    </div>
  );
}

async function PagoIndividual({ userId, destacarListingId }: { userId: string; destacarListingId?: string }) {
  const [profile, available, pendingVouchers, packPlans, comboPlan, perDayPlan, featurableListings, groups, history] =
    await Promise.all([
      getFullProfile(userId),
      getAvailablePublications(userId),
      getPendingFeaturedVouchers(userId),
      getPublicationPackPlans(),
      getPlanByCode("PUBLICATION_30D_FEATURED_7D"),
      getPlanByCode("FEATURE_PER_DAY"),
      getFeaturableListings(userId),
      getOwnerListingGroups(userId),
      getPaymentHistory(userId),
    ]);

  const singlePlan = packPlans.find((p) => p.code === "PUBLICATIONS_PACK_1");
  const featuredListings = groups.destacadas;
  const featurableForCarrito = featurableListings.map((l) => ({
    id: l.id,
    title: l.title,
    maxDays: daysRemaining(l.expiresAt),
  }));

  return (
    <div className="space-y-10">
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Publicaciones realizadas" value={profile?.activationCount ?? 0} />
          <StatCard label="Publicaciones disponibles" value={available} />
          <StatCard label="Destacados disponibles" value={pendingVouchers} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-navy">Comprar</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-bold text-navy">Anuncios destacados</h2>
        <p className="mb-4 text-sm text-muted-foreground">Tus publicaciones destacadas actualmente.</p>
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
                  {mileageUnitFor(listing.vehicleType) && (
                    <p className="text-xs text-muted-foreground">
                      {formatKm(listing.mileageKm, mileageUnitFor(listing.vehicleType)!)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <PaymentHistorySection history={history} />
    </div>
  );
}

async function Suscripciones({ userId }: { userId: string }) {
  const [plans, status] = await Promise.all([getSubscriptionPlans(), getSubscriptionStatus(userId)]);

  return (
    <div className="space-y-6">
      {status.active && status.expiresAt && (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-foreground">
            Tenés {status.quota} publicaciones activas hasta el {dateFormatter.format(status.expiresAt)}.
          </p>
          <p className="mt-1 text-muted-foreground">
            Al vencer, las publicaciones que no reactivaste con cupo disponible pasan a Inactivas. Contratar una
            suscripción nueva reemplaza esta.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
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
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-navy">{value}</p>
      </CardContent>
    </Card>
  );
}

function PaymentHistorySection({ history }: { history: Awaited<ReturnType<typeof getPaymentHistory>> }) {
  return (
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
                        payment.status === "APPROVED" ? "success" : payment.status === "REJECTED" ? "danger" : "default"
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
  );
}

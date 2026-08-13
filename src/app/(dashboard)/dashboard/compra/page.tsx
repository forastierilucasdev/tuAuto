import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { AnunciosSubNav } from "@/components/dashboard/AnunciosSubNav";
import { ComprasTabs, type ComprasTabKey } from "@/components/dashboard/ComprasTabs";
import { FeatureComboWizard } from "@/components/dashboard/FeatureComboWizard";
import { DestacarPorDiasCarrito } from "@/components/dashboard/DestacarPorDiasCarrito";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getFeaturableListings } from "@/server/data/listings";
import { getPlanByCode, getPublicationPackPlans, getSubscriptionPlans, getSubscriptionStatus } from "@/server/data/payments";
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
  const vista: ComprasTabKey = param(sp, "vista") === "suscripcion" ? "suscripcion" : "individual";
  const destacarListingId = param(sp, "destacar");

  const session = await auth();
  const userId = session!.user.id;

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/dashboard/anuncios" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Mis compras</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Pagás de forma segura con Mercado Pago.</p>

      <AnunciosSubNav />
      <ComprasTabs active={vista} />

      {vista === "individual" ? (
        <PagoIndividual userId={userId} destacarListingId={destacarListingId} />
      ) : (
        <Suscripciones userId={userId} />
      )}
    </div>
  );
}

async function PagoIndividual({ userId, destacarListingId }: { userId: string; destacarListingId?: string }) {
  const [singlePlanList, comboPlan, perDayPlan, featurableListings] = await Promise.all([
    getPublicationPackPlans(),
    getPlanByCode("PUBLICATION_30D_FEATURED_7D"),
    getPlanByCode("FEATURE_PER_DAY"),
    getFeaturableListings(userId),
  ]);

  const singlePlan = singlePlanList.find((p) => p.code === "PUBLICATIONS_PACK_1");
  const featurableForCarrito = featurableListings.map((l) => ({
    id: l.id,
    title: l.title,
    maxDays: daysRemaining(l.expiresAt),
  }));

  return (
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

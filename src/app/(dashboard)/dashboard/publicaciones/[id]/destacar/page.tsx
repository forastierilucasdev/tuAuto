import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOwnedListingForEdit } from "@/server/data/listings";
import { getPlanByCode } from "@/server/data/payments";
import { payListingFeatureAction } from "@/server/actions/payment.actions";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { FALLBACK_IMAGE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Destacar anuncio" };

const FEATURE_PLAN_CODE = "FEATURE_LISTING";

const BENEFITS = [
  "Aparece en los primeros resultados del catálogo",
  "Mayor visibilidad frente a los compradores",
  "Más posibilidades de venta",
];

export default async function DestacarPublicacionPage(
  props: PageProps<"/dashboard/publicaciones/[id]/destacar">
) {
  const { id } = await props.params;
  const session = await auth();
  const [listing, plan] = await Promise.all([
    getOwnedListingForEdit(id, session!.user.id),
    getPlanByCode(FEATURE_PLAN_CODE),
  ]);
  if (!listing || !plan) notFound();

  const alreadyFeatured = listing.featured;
  const canFeature = listing.status === "ACTIVE" && !alreadyFeatured;

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy">Destacar anuncio</h1>
        <BackButton />
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex gap-3 p-4">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
            <Image
              src={listing.images[0]?.url ?? FALLBACK_IMAGE}
              alt={listing.title}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy">{listing.title}</p>
            <p className="font-bold text-primary">{formatCurrency(Number(listing.price), listing.currency)}</p>
          </div>
        </div>
      </Card>

      {!canFeature ? (
        <p className="mt-6 rounded-lg border border-border bg-surface-muted p-4 text-center text-sm text-muted-foreground">
          {alreadyFeatured
            ? "Esta publicación ya está destacada."
            : "Solo se pueden destacar publicaciones activas."}
        </p>
      ) : (
        <Card className="relative mt-6 overflow-hidden border-warning/40 bg-gradient-to-br from-warning/10 via-surface to-surface p-0">
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                <TrendingUp className="h-5 w-5" />
              </span>
              <p className="text-lg font-bold text-navy">Destacá tu anuncio</p>
            </div>

            <ul className="space-y-2">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs text-muted-foreground">Costo único · {plan.durationDays} días</p>
              <p className="text-3xl font-extrabold text-navy">{formatCurrency(Number(plan.price))}</p>
            </div>

            <form action={payListingFeatureAction}>
              <input type="hidden" name="planCode" value={plan.code} />
              <input type="hidden" name="listingId" value={listing.id} />
              <Button type="submit" size="lg" className="w-full">
                Pagar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { AnunciosSubNav } from "@/components/dashboard/AnunciosSubNav";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent } from "@/components/ui/Card";
import { getAvailablePublications, getOwnerListingGroups } from "@/server/data/listings";
import { getPendingFeaturedVouchers, getSubscriptionStatus } from "@/server/data/payments";
import { getFullProfile } from "@/server/data/users";

export const metadata: Metadata = { title: "Administrador de anuncios" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

function StatCard({
  label,
  value,
  hint,
  href,
  linkLabel = "Ver",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  href: string;
  linkLabel?: "Ver" | "Comprar";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 pt-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-extrabold text-navy">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        <Link href={href} className="mt-2 text-xs font-medium text-primary hover:underline">
          {linkLabel}
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function AdministradorAnunciosPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile, available, groups, subscription, pendingVouchers] = await Promise.all([
    getFullProfile(userId),
    getAvailablePublications(userId),
    getOwnerListingGroups(userId),
    getSubscriptionStatus(userId),
    getPendingFeaturedVouchers(userId),
  ]);

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Administrador de anuncios</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Un resumen de tus publicaciones y tu cupo disponible.</p>

      <AnunciosSubNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Publicaciones compradas"
          value={profile?.purchasedPublications ?? 0}
          href="/dashboard/compra?vista=individual"
          linkLabel="Comprar"
        />
        <StatCard
          label="Publicaciones realizadas"
          value={profile?.activationCount ?? 0}
          href="/dashboard/publicaciones?tab=todas"
        />
        <StatCard
          label="Publicaciones disponibles"
          value={available}
          href="/dashboard/compra?vista=individual"
          linkLabel="Comprar"
        />
        <StatCard
          label="Publicaciones destacadas"
          value={groups.destacadas.length}
          href="/dashboard/publicaciones?tab=destacadas"
        />
        <StatCard
          label="Vouchers de destacado comprados"
          value={profile?.featuredVouchersGranted ?? 0}
          href="/dashboard/compra?vista=individual"
          linkLabel="Comprar"
        />
        <StatCard
          label="Vouchers de destacado utilizados"
          value={profile?.featuredVouchersUsed ?? 0}
          href="/dashboard/publicaciones?tab=destacadas"
        />
        <StatCard
          label="Vouchers de destacado disponibles"
          value={pendingVouchers}
          hint="Créditos de destacado sin usar"
          href="/dashboard/compra?vista=individual"
          linkLabel="Comprar"
        />
        <StatCard
          label="Reservadas"
          value={groups.reservadas.length}
          href="/dashboard/publicaciones?tab=reservadas"
        />
        <StatCard label="Inactivas" value={groups.inactivas.length} href="/dashboard/publicaciones?tab=inactivas" />
        <StatCard label="Vendidas" value={groups.vendidas.length} href="/dashboard/publicaciones?tab=vendidas" />
        <StatCard
          label="Suscripción"
          value={subscription.active ? (subscription.planName ?? "Plan activo") : "Sin suscripción activa"}
          hint={
            subscription.active && subscription.expiresAt
              ? `Vence el ${dateFormatter.format(subscription.expiresAt)}`
              : undefined
          }
          href="/dashboard/compra?vista=suscripcion"
          linkLabel="Comprar"
        />
      </div>
    </div>
  );
}

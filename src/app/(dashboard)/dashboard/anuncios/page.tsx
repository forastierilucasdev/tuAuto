import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { AnunciosSubNav } from "@/components/dashboard/AnunciosSubNav";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent } from "@/components/ui/Card";
import { getAvailablePublications, getOwnerListingGroups } from "@/server/data/listings";
import { getPendingFeaturedVouchers, getSubscriptionStatus } from "@/server/data/payments";
import { getFullProfile } from "@/server/data/users";

export const metadata: Metadata = { title: "Administrador de anuncios" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-navy">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
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
        <BackButton />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Administrador de anuncios</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Un resumen de tus publicaciones y tu cupo disponible.</p>

      <AnunciosSubNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Publicaciones disponibles" value={available} />
        <StatCard label="Publicaciones realizadas" value={profile?.activationCount ?? 0} />
        <StatCard label="Publicaciones destacadas" value={groups.destacadas.length} />
        <StatCard label="Destacados disponibles" value={pendingVouchers} hint="Créditos de destacado sin usar" />
        <StatCard
          label="Suscripción"
          value={subscription.active ? `${subscription.quota} publicaciones` : "Sin suscripción activa"}
          hint={
            subscription.active && subscription.expiresAt
              ? `Vence el ${dateFormatter.format(subscription.expiresAt)}`
              : undefined
          }
        />
        <StatCard label="Reservadas" value={groups.reservadas.length} />
        <StatCard label="Inactivas" value={groups.inactivas.length} />
        <StatCard label="Vendidas" value={groups.vendidas.length} />
      </div>
    </div>
  );
}

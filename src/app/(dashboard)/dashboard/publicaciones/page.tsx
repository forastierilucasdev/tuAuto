import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAvailablePublications, getOwnerListingGroups } from "@/server/data/listings";
import { getFullProfile } from "@/server/data/users";
import { OwnerListingCard } from "@/components/dashboard/OwnerListingCard";
import { PublishedListingModal } from "@/components/dashboard/PublishedListingModal";
import { PublicacionesTabs } from "@/components/dashboard/PublicacionesTabs";
import { AnunciosSubNav } from "@/components/dashboard/AnunciosSubNav";
import { buttonVariants } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { PUBLICACIONES_TABS, type PublicacionesTabKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis publicaciones" };

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function MisPublicacionesPage(props: PageProps<"/dashboard/publicaciones">) {
  const sp = await props.searchParams;
  const requestedTab = param(sp, "tab");
  const activeTab: PublicacionesTabKey | "todas" =
    requestedTab === "todas" ? "todas" : (PUBLICACIONES_TABS.find((t) => t.key === requestedTab)?.key ?? "activas");
  const publishedSlug = param(sp, "published");

  const session = await auth();
  const [groups, profile, available] = await Promise.all([
    getOwnerListingGroups(session!.user.id),
    getFullProfile(session!.user.id),
    getAvailablePublications(session!.user.id),
  ]);
  const allListings = PUBLICACIONES_TABS.flatMap((tab) => groups[tab.key]);
  const listings = activeTab === "todas" ? allListings : groups[activeTab];
  const counts = {
    todas: allListings.length,
    activas: groups.activas.length,
    destacadas: groups.destacadas.length,
    reservadas: groups.reservadas.length,
    inactivas: groups.inactivas.length,
    vendidas: groups.vendidas.length,
  };

  return (
    <div>
      <PublishedListingModal slug={publishedSlug} />

      <div className="flex justify-end">
        <BackButton />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Mis publicaciones</h1>

      <AnunciosSubNav />

      <div className="mt-4 flex flex-col items-start gap-3">
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link href="/dashboard/publicaciones/nueva" className={cn(buttonVariants({ variant: "primary" }), "w-full")}>
            Publicar vehículo
          </Link>
          <Link href="/dashboard/compra" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Comprar publicaciones
          </Link>
        </div>
        {profile && (
          <div className="text-xs text-muted-foreground">
            <p>
              Publicaciones realizadas: <span className="font-semibold text-foreground">{profile.activationCount}</span>
            </p>
            <p>
              Publicaciones disponibles: <span className="font-semibold text-foreground">{available}</span>
            </p>
          </div>
        )}
      </div>

      <PublicacionesTabs activeTab={activeTab} counts={counts} />

      <div className="mt-6">
        {listings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No tenés publicaciones en esta sección todavía.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <OwnerListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

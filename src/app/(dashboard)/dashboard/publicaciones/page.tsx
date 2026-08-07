import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAvailablePublications, getOwnerListingGroups } from "@/server/data/listings";
import { getFullProfile } from "@/server/data/users";
import { OwnerListingCard } from "@/components/dashboard/OwnerListingCard";
import { PublishedListingModal } from "@/components/dashboard/PublishedListingModal";
import { buttonVariants } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis publicaciones" };

const TABS = [
  { key: "activas", label: "Activas" },
  { key: "destacadas", label: "Destacadas" },
  { key: "reservadas", label: "Reservadas" },
  { key: "inactivas", label: "Inactivas" },
  { key: "vendidas", label: "Vendidas" },
] as const;

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function MisPublicacionesPage(props: PageProps<"/dashboard/publicaciones">) {
  const sp = await props.searchParams;
  const requestedTab = param(sp, "tab");
  const activeTab = TABS.find((t) => t.key === requestedTab)?.key ?? "activas";
  const publishedSlug = param(sp, "published");

  const session = await auth();
  const [groups, profile, available] = await Promise.all([
    getOwnerListingGroups(session!.user.id),
    getFullProfile(session!.user.id),
    getAvailablePublications(session!.user.id),
  ]);
  const listings = groups[activeTab];

  return (
    <div>
      <PublishedListingModal slug={publishedSlug} />

      <div className="flex justify-end">
        <BackButton />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Mis publicaciones</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/dashboard/publicaciones/nueva" className={buttonVariants({ variant: "primary" })}>
          Publicar vehículo
        </Link>
        {profile && (
          <p className="text-xs text-muted-foreground">
            Publicaciones realizadas: <span className="font-semibold text-foreground">{profile.activationCount}</span>
            {" · "}
            Publicaciones disponibles: <span className="font-semibold text-foreground">{available}</span>
          </p>
        )}
        <Link
          href="/dashboard/pago#comprar-publicaciones"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Comprar publicaciones
        </Link>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/publicaciones?tab=${tab.key}`}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label} ({groups[tab.key].length})
          </Link>
        ))}
      </div>

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

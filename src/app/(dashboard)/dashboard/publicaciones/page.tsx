import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOwnerListingGroups } from "@/server/data/listings";
import { OwnerListingCard } from "@/components/dashboard/OwnerListingCard";
import { buttonVariants } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis publicaciones" };

const TABS = [
  { key: "activas", label: "Activas" },
  { key: "destacadas", label: "Destacadas" },
  { key: "inactivas", label: "Inactivas" },
] as const;

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function MisPublicacionesPage(props: PageProps<"/dashboard/publicaciones">) {
  const sp = await props.searchParams;
  const requestedTab = param(sp, "tab");
  const activeTab = TABS.find((t) => t.key === requestedTab)?.key ?? "activas";

  const session = await auth();
  const groups = await getOwnerListingGroups(session!.user.id);
  const listings = groups[activeTab];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">Mis publicaciones</h1>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/publicaciones/nueva" className={buttonVariants({ variant: "primary" })}>
            Publicar vehículo
          </Link>
          <BackButton />
        </div>
      </div>

      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/publicaciones?tab=${tab.key}`}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { BackButton } from "@/components/ui/BackButton";
import { getAgencyProfile } from "@/server/data/agencies";
import { getActiveListingsByUser } from "@/server/data/listings";

export async function generateMetadata(props: PageProps<"/concesionarias/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const profile = await getAgencyProfile(id);
  return { title: profile?.businessName ?? "Concesionaria no encontrada" };
}

export default async function ConcesionariaDetailPage(props: PageProps<"/concesionarias/[id]">) {
  const { id } = await props.params;
  const profile = await getAgencyProfile(id);
  if (!profile) notFound();

  const listings = await getActiveListingsByUser(id);
  const websiteHref = profile.website
    ? profile.website.startsWith("http")
      ? profile.website
      : `https://${profile.website}`
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-end">
        <BackButton href="/concesionarias" />
      </div>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-2xl bg-surface-muted">
          {profile.logoUrl ? (
            <Image
              src={profile.logoUrl}
              alt={profile.businessName}
              fill
              sizes="176px"
              className="object-cover"
              style={{ objectPosition: `${profile.logoPositionX}% ${profile.logoPositionY}%` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <Building2 className="h-10 w-10" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{profile.businessName}</h1>
          {(profile.city || profile.province) && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[profile.city, profile.province].filter(Boolean).join(", ")}
            </p>
          )}
          {profile.address && <p className="mt-1 text-sm text-muted-foreground">{profile.address}</p>}
          {websiteHref && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {profile.website}
            </a>
          )}
        </div>
      </div>

      {profile.description && <p className="mt-6 max-w-2xl text-foreground/90">{profile.description}</p>}

      <h2 className="mt-10 mb-4 text-lg font-bold text-navy">Publicaciones activas</h2>
      {listings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Esta concesionaria no tiene publicaciones activas en este momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((vehicle) => (
            <VehicleCard key={vehicle.slug} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}

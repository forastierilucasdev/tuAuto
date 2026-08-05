import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">{profile.businessName}</h1>
      {(profile.city || profile.province) && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {[profile.city, profile.province].filter(Boolean).join(", ")}
        </p>
      )}
      {profile.description && <p className="mt-4 max-w-2xl text-foreground/90">{profile.description}</p>}

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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedListingForEdit } from "@/server/data/listings";
import { getFullProfile } from "@/server/data/users";
import { isBusinessAccountType } from "@/lib/constants";
import { ListingForm } from "@/components/forms/ListingForm";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Editar publicación" };

const REACTIVATABLE = new Set(["RESERVADA", "PAUSADA", "EXPIRED", "DRAFT"]);

export default async function EditarPublicacionPage(props: PageProps<"/dashboard/publicaciones/[id]/editar">) {
  const { id } = await props.params;
  const session = await auth();
  const [listing, profile] = await Promise.all([
    getOwnedListingForEdit(id, session!.user.id),
    getFullProfile(session!.user.id),
  ]);
  if (!listing || !profile) notFound();

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/dashboard/publicaciones" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Editar publicación</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Actualizá los datos de tu publicación.</p>
      {REACTIVATABLE.has(listing.status) && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          {listing.status === "DRAFT" ? (
            <>Al guardar los cambios, tu publicación se <strong>publica</strong>.</>
          ) : (
            <>Al guardar los cambios, tu publicación vuelve a estar <strong>activa</strong>.</>
          )}
        </div>
      )}
      <ListingForm
        mode="edit"
        listingId={listing.id}
        isReactivation={REACTIVATABLE.has(listing.status)}
        vehicleType={listing.vehicleType.code}
        brandSlug={listing.brand.slug}
        brandName={listing.brand.name}
        modelSlug={listing.model.slug}
        modelName={listing.model.name}
        versionSlug={listing.versionRef?.slug ?? null}
        versionName={listing.versionRef?.name ?? null}
        provinceSlug={listing.provinceRef?.slug ?? null}
        provinceName={listing.provinceRef?.name ?? null}
        localitySlug={listing.localityRef?.slug ?? null}
        localityName={listing.localityRef?.name ?? null}
        year={listing.year}
        seller={{
          fullName: profile.fullName,
          phone: profile.phone,
          businessName: isBusinessAccountType(profile.accountType)
            ? profile.agencyProfile?.businessName
            : undefined,
        }}
        defaultValues={{
          version: listing.version,
          condition: listing.condition,
          transmission: listing.transmission,
          description: listing.description,
          price: Number(listing.price),
          currency: listing.currency,
          priceNegotiable: listing.priceNegotiable,
          acceptsTrade: listing.acceptsTrade,
          acceptsFinancing: listing.acceptsFinancing,
          mileageKm: listing.mileageKm,
          city: listing.city,
          province: listing.province,
          contactAddress: listing.contactAddress,
        }}
        existingImages={listing.images.map((img) => ({ id: img.id, url: img.url }))}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedListingForEdit } from "@/server/data/listings";
import { getFullProfile } from "@/server/data/users";
import { isBusinessAccountType, vehicleTypeLabel } from "@/lib/constants";
import { ListingForm } from "@/components/forms/ListingForm";

export const metadata: Metadata = { title: "Editar publicación" };

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
      <h1 className="text-2xl font-bold text-navy">Editar publicación</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Actualizá los datos de tu publicación.</p>
      <ListingForm
        mode="edit"
        listingId={listing.id}
        vehicleTypeLabel={vehicleTypeLabel(listing.vehicleType)}
        brandName={listing.brand.name}
        modelName={listing.model.name}
        year={listing.year}
        seller={{
          fullName: profile.fullName,
          phone: profile.phone,
          businessName: isBusinessAccountType(profile.accountType)
            ? profile.agencyProfile?.businessName
            : undefined,
        }}
        defaultValues={{
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

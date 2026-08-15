import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { requireAdminPermission, requireSuperAdminRole } from "@/lib/admin-permissions";
import { getListingForAdminDetail } from "@/server/data/admin/listings";
import { getFullProfile } from "@/server/data/users";
import { isBusinessAccountType } from "@/lib/constants";
import { ListingForm } from "@/components/forms/ListingForm";
import {
  adminDeleteListingImageAction,
  adminReorderListingImagesAction,
  adminUpdateListingFullAction,
} from "@/server/actions/admin/listings.actions";

export const metadata: Metadata = { title: "Editar publicación (wizard) | Admin" };

export default async function AdminListingEditWizardPage(props: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("publicaciones", "edit");
  requireSuperAdminRole(session.user.adminRole);
  const { id } = await props.params;

  const listing = await getListingForAdminDetail(id);
  if (!listing) notFound();
  const profile = await getFullProfile(listing.user.id);
  if (!profile) notFound();

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href={`/admin/publicaciones/${id}`} />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Editar publicación (wizard completo)</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Dueño: {profile.fullName} ({profile.email}). Esta pantalla es exclusiva de Superadministrador — no cambia
        el estado de la publicación ni consume cupo del dueño, eso se maneja desde la sección &quot;Estado&quot;.
      </p>

      <ListingForm
        mode="edit"
        listingId={listing.id}
        isReactivation={false}
        vehicleType={listing.vehicleType.code}
        brandSlug={listing.brand.slug}
        brandName={listing.brand.name}
        modelSlug={listing.model.slug}
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
        updateAction={adminUpdateListingFullAction.bind(null, listing.id)}
        deleteImageAction={adminDeleteListingImageAction}
        reorderImagesAction={adminReorderListingImagesAction}
        requireDeleteReason
      />
    </div>
  );
}

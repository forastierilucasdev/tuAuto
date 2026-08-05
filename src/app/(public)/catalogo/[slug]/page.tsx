import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Gauge, MapPin, MessageCircle } from "lucide-react";
import { VehicleGallery } from "@/components/vehicles/VehicleGallery";
import { buttonVariants } from "@/components/ui/Button";
import { getListingBySlug } from "@/server/data/listings";
import { buildWhatsAppLink, cn, formatCurrency, formatKm } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/catalogo/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const listing = await getListingBySlug(slug);
  return { title: listing?.title ?? "Publicación no encontrada" };
}

export default async function ListingDetailPage(props: PageProps<"/catalogo/[slug]">) {
  const { slug } = await props.params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const sellerName =
    listing.user.accountType === "AGENCIA"
      ? (listing.user.agencyProfile?.businessName ?? listing.user.fullName)
      : listing.user.fullName;

  const whatsappHref = buildWhatsAppLink(
    listing.user.phone,
    `Hola! Te escribo por el aviso de "${listing.title}" que vi en tuAuto.`
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <VehicleGallery images={listing.images} title={listing.title} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{listing.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {listing.brand.name} {listing.model.name} · {listing.year}
          </p>

          <p className="mt-4 text-3xl font-extrabold text-primary">
            {formatCurrency(Number(listing.price), listing.currency)}
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {listing.mileageKm != null && (
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="h-4 w-4" />
                {formatKm(listing.mileageKm)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {listing.year}
            </span>
            {(listing.city || listing.province) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {[listing.city, listing.province].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          <div className="mt-6 whitespace-pre-line text-foreground/90">{listing.description}</div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-5 shadow-card">
          <p className="text-xs font-medium text-muted-foreground">Publicado por</p>
          <p className="mt-1 font-semibold text-navy">{sellerName}</p>
          {listing.user.accountType === "AGENCIA" && listing.user.agencyProfile?.city && (
            <p className="text-sm text-muted-foreground">
              {listing.user.agencyProfile.city}, {listing.user.agencyProfile.province}
            </p>
          )}

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-4 w-full")}
          >
            <MessageCircle className="h-4 w-4" />
            Contactar por WhatsApp
          </a>
        </aside>
      </div>
    </div>
  );
}

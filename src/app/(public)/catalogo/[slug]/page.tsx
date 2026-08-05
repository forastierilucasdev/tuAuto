import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Banknote,
  Building2,
  Check,
  FileText,
  Info,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { VehicleGallery } from "@/components/vehicles/VehicleGallery";
import { VerticalTabs, type VerticalTabItem } from "@/components/ui/VerticalTabs";
import { buttonVariants } from "@/components/ui/Button";
import { getListingBySlug } from "@/server/data/listings";
import { buildWhatsAppLink, cn, formatCurrency, formatKm } from "@/lib/utils";
import { accountTypeLabel, conditionLabel, isBusinessAccountType, transmissionLabel } from "@/lib/constants";

export async function generateMetadata(props: PageProps<"/catalogo/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const listing = await getListingBySlug(slug);
  return { title: listing?.title ?? "Publicación no encontrada" };
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default async function ListingDetailPage(props: PageProps<"/catalogo/[slug]">) {
  const { slug } = await props.params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const isBusiness = isBusinessAccountType(listing.user.accountType);
  const businessName = listing.user.agencyProfile?.businessName;
  const contactAddress = listing.contactAddress ?? listing.user.agencyProfile?.address ?? null;

  const whatsappHref = buildWhatsAppLink(
    listing.user.phone,
    `Hola te contacto a través de Motoresya.com.ar, quiero más información sobre la publicación ${listing.title}`
  );

  const tabs: VerticalTabItem[] = [
    {
      id: "datos",
      label: "Datos principales",
      icon: <Info className="h-4 w-4 shrink-0" />,
      content: (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
          <Field label="Marca" value={listing.brand.name} />
          <Field label="Modelo" value={listing.model.name} />
          <Field label="Año" value={listing.year} />
          {listing.version && <Field label="Versión" value={listing.version} />}
          {listing.transmission && (
            <Field label="Transmisión" value={transmissionLabel(listing.transmission)} />
          )}
          <Field label="Km" value={formatKm(listing.mileageKm)} />
          <Field label="Condición" value={conditionLabel(listing.condition)} />
          <Field label="Tipo de vendedor" value={accountTypeLabel(listing.user.accountType)} />
        </dl>
      ),
    },
    {
      id: "precio",
      label: "Precio",
      icon: <Banknote className="h-4 w-4 shrink-0" />,
      content: (
        <div>
          <p className="text-3xl font-extrabold text-primary">
            {formatCurrency(Number(listing.price), listing.currency)}
          </p>
          {(listing.priceNegotiable || listing.acceptsTrade || listing.acceptsFinancing) && (
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {listing.priceNegotiable && (
                <li className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Precio sujeto a negociación
                </li>
              )}
              {listing.acceptsTrade && (
                <li className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Acepta permuta
                </li>
              )}
              {listing.acceptsFinancing && (
                <li className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> Acepta financiamiento
                </li>
              )}
            </ul>
          )}
        </div>
      ),
    },
    {
      id: "ubicacion",
      label: "Ubicación",
      icon: <MapPin className="h-4 w-4 shrink-0" />,
      content: (
        <p className="text-foreground">
          {[listing.province, listing.city].filter(Boolean).join(" - ") || "No especificada"}
        </p>
      ),
    },
    {
      id: "observaciones",
      label: "Observaciones",
      icon: <FileText className="h-4 w-4 shrink-0" />,
      content: (
        <p className="whitespace-pre-line text-foreground/90">
          {listing.description || "El vendedor no dejó observaciones adicionales."}
        </p>
      ),
    },
    {
      id: "contacto",
      label: "Contacto",
      icon: <Phone className="h-4 w-4 shrink-0" />,
      content: (
        <dl className="space-y-4">
          <Field label="Nombre y apellido" value={listing.user.fullName} />
          {isBusiness && businessName && (
            <Field
              label={listing.user.accountType === "CONCESIONARIA" ? "Concesionaria" : "Agencia"}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {businessName}
                </span>
              }
            />
          )}
          <Field
            label="WhatsApp"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {listing.user.phone}
              </span>
            }
          />
          {contactAddress && <Field label="Dirección" value={contactAddress} />}
        </dl>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      {/* Mobile: fotos primero. Desktop (sm+): título primero, luego fotos. */}
      <h1 className="order-2 mt-6 text-2xl font-bold text-navy sm:order-1 sm:mt-0 sm:mb-6 sm:text-3xl">
        {listing.title}
      </h1>

      <div className="order-1 sm:order-2">
        <VehicleGallery images={listing.images} title={listing.title} />
      </div>

      <div className="order-3 mt-6 sm:mt-4">
        <VerticalTabs tabs={tabs} />
      </div>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "primary", size: "lg" }), "order-4 mt-4 w-full sm:w-auto")}
      >
        <MessageCircle className="h-4 w-4" />
        Contactar por WhatsApp
      </a>
    </div>
  );
}

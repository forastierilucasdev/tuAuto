import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { getAgencies } from "@/server/data/agencies";
import { accountTypeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type Agency = Awaited<ReturnType<typeof getAgencies>>[number];

/** Tarjeta de concesionaria/agencia — misma estructura y alto que `VehicleCard` (imagen `aspect-4/3` + bloque de texto con `p-4`), reutilizada tanto en el listado de `/concesionarias` como en el carrusel de destacadas del inicio. */
export function AgencyCard({ agency }: { agency: Agency }) {
  const location = [agency.province, agency.city].filter(Boolean).join(" - ");

  return (
    <Link href={`/concesionarias/${agency.userId}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-shadow hover:shadow-card-hover">
        <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-muted">
          {agency.logoUrl ? (
            <Image
              src={agency.logoUrl}
              alt={agency.businessName}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              style={{ objectPosition: `${agency.logoPositionX}% ${agency.logoPositionY}%` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <Building2 className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="truncate font-semibold text-navy">{agency.businessName}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {accountTypeLabel(agency.accountType)}
            </span>
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {agency.activeListings} publicaci{agency.activeListings === 1 ? "ón" : "ones"}
          </p>
          <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto w-full")}>
            Ver publicaciones
          </span>
        </div>
      </Card>
    </Link>
  );
}

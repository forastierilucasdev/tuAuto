import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";
import type { getFeaturedAgencies } from "@/server/data/agencies";

type Agency = Awaited<ReturnType<typeof getFeaturedAgencies>>[number];

/** Carrusel horizontal (scroll, sin autoplay) de concesionarias/agencias destacadas — misma foto de portada (`logoUrl`) que se usa en `/concesionarias`, en formato más compacto para el inicio. */
export function FeaturedAgenciesCarousel({ agencies }: { agencies: Agency[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {agencies.map((agency) => (
        <Link
          key={agency.userId}
          href={`/concesionarias/${agency.userId}`}
          className="group block w-40 shrink-0 sm:w-52"
        >
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-surface-muted shadow-card transition-shadow group-hover:shadow-card-hover">
            {agency.logoUrl ? (
              <Image
                src={agency.logoUrl}
                alt={agency.businessName}
                fill
                sizes="(min-width: 640px) 208px, 160px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <Building2 className="h-8 w-8" />
              </div>
            )}
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-navy">{agency.businessName}</p>
        </Link>
      ))}
    </div>
  );
}

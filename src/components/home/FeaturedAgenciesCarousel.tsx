import { AgencyCard, type Agency } from "@/components/vehicles/AgencyCard";

/** Carrusel horizontal (scroll, sin autoplay) de concesionarias/agencias destacadas — misma tarjeta (`AgencyCard`) y alto que las tarjetas de "Publicaciones destacadas", cada elemento ocupa un ancho fijo dentro de la fila con scroll. */
export function FeaturedAgenciesCarousel({ agencies }: { agencies: Agency[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {agencies.map((agency) => (
        <div key={agency.userId} className="w-64 shrink-0 sm:w-72">
          <AgencyCard agency={agency} />
        </div>
      ))}
    </div>
  );
}

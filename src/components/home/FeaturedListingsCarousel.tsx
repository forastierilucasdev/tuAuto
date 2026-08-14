import { VehicleCard } from "@/components/vehicles/VehicleCard";
import type { VehicleCardData } from "@/types/vehicle";

/** Carrusel horizontal (scroll, sin autoplay) de publicaciones destacadas — mismo patrón que `FeaturedAgenciesCarousel`, cada elemento ocupa un ancho fijo dentro de la fila con scroll. */
export function FeaturedListingsCarousel({ vehicles }: { vehicles: VehicleCardData[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {vehicles.map((vehicle) => (
        <div key={vehicle.slug} className="w-64 shrink-0 sm:w-72">
          <VehicleCard vehicle={vehicle} />
        </div>
      ))}
    </div>
  );
}

import Link from "next/link";
import { HeroSearch } from "@/components/home/HeroSearch";
import { CategoryGrid } from "@/components/vehicles/CategoryGrid";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getFeaturedListings } from "@/server/data/listings";

// Dinámico: muestra publicaciones destacadas reales en cada request, en vez
// de congelarlas en el build (ver ARCHITECTURE.md, "Cache Components").
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedListings(6);

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-surface-muted to-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-5xl">
              Encontrá el vehículo de tus sueños.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Autos, camionetas, motos y más, publicados por particulares y concesionarias de
              todo el país.
            </p>
            <div className="mt-8">
              <HeroSearch />
            </div>
          </div>

          <div className="hidden aspect-[4/3] overflow-hidden rounded-2xl bg-surface-muted shadow-card lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://picsum.photos/seed/tuauto-hero/900/700"
              alt="Vehículo destacado"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-navy sm:text-2xl">Publicaciones destacadas</h2>
            <Link href="/catalogo" className="text-sm font-medium text-primary hover:underline">
              Ver todo el catálogo
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((vehicle) => (
              <VehicleCard key={vehicle.slug} vehicle={vehicle} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-bold text-navy sm:text-2xl">Explorá por categoría</h2>
        <CategoryGrid />
      </section>

      <section className="bg-navy py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">¿Tenés un vehículo para vender?</h2>
          <p className="max-w-xl text-white/70">
            Publicá tu anuncio en minutos, particular o como concesionaria, y llegá a miles de
            compradores.
          </p>
          <Link href="/login" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
            Vende tu Auto
          </Link>
        </div>
      </section>
    </>
  );
}

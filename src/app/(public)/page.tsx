import Image from "next/image";
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
      {/* Foto de fondo con el buscador embebido encima — mismo patrón en
          mobile y desktop, antes desktop mostraba la foto aparte al costado. */}
      <section className="relative">
        <div className="relative flex min-h-[32rem] w-full flex-col justify-end overflow-hidden lg:min-h-[38rem] lg:justify-center">
          <Image
            src="/hero-bg.jpg"
            alt="Vehículo destacado"
            fill
            priority
            sizes="100vw"
            // El auto de la foto está sobre el lado derecho — con el recorte
            // centrado por default, en pantallas angostas quedaba afuera.
            // Ancla el recorte a la derecha para que siga viéndose en mobile.
            className="object-cover object-right"
          />
          {/* Degradado más liviano en mobile (antes tapaba casi toda la
              foto) — solo lo necesario para que el texto blanco se lea. */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/35 to-navy/5 lg:bg-gradient-to-r lg:from-navy/95 lg:via-navy/70 lg:to-navy/10" />

          <div className="relative px-4 pb-6 pt-24 sm:px-6 lg:max-w-2xl lg:px-8 lg:py-20">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Encontrá el vehículo de tus sueños.
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/85 sm:text-lg">
              Autos, camionetas, motos y más, publicados por particulares y concesionarias de
              todo el país.
            </p>
            <div className="mt-6 lg:mt-8">
              <HeroSearch />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-bold text-navy sm:text-2xl">Explorá por categoría</h2>
        <CategoryGrid />
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
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

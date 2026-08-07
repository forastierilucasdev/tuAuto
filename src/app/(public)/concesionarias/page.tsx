import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Search, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getAgencies, getFeaturedAgencies } from "@/server/data/agencies";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Concesionarias" };

export const dynamic = "force-dynamic";

type Agency = Awaited<ReturnType<typeof getAgencies>>[number];

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

function AgencyCard({ agency }: { agency: Agency }) {
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
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <Building2 className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="truncate font-semibold text-navy">{agency.businessName}</p>
          {location && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          )}
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

export default async function ConcesionariasPage(props: PageProps<"/concesionarias">) {
  const sp = await props.searchParams;
  const provincia = param(sp, "provincia") ?? "";
  const localidad = param(sp, "localidad") ?? "";
  const hasFilters = Boolean(provincia || localidad);

  const [agencies, featured] = await Promise.all([
    getAgencies({ province: provincia || undefined, city: localidad || undefined }),
    hasFilters ? Promise.resolve([]) : getFeaturedAgencies(4),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Concesionarias</h1>
      <p className="mt-1 text-muted-foreground">Agencias y concesionarias que publican en Motoresya.</p>

      <form
        method="get"
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-end"
      >
        <div className="sm:flex-1">
          <Label htmlFor="provincia">Provincia</Label>
          <Input id="provincia" name="provincia" defaultValue={provincia} placeholder="Ej: Buenos Aires" />
        </div>
        <div className="sm:flex-1">
          <Label htmlFor="localidad">Localidad</Label>
          <Input id="localidad" name="localidad" defaultValue={localidad} placeholder="Ej: La Plata" />
        </div>
        <Button type="submit" className="sm:w-auto">
          <Search className="h-4 w-4" />
          Buscar
        </Button>
        {hasFilters && (
          <Link href="/concesionarias" className={cn(buttonVariants({ variant: "outline" }), "sm:w-auto")}>
            Limpiar
          </Link>
        )}
      </form>

      {!hasFilters && featured.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-navy">
            <Star className="h-5 w-5 fill-current text-warning" />
            Concesionarias destacadas
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((agency) => (
              <AgencyCard key={agency.userId} agency={agency} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        {!hasFilters && <h2 className="mb-4 text-lg font-bold text-navy">Todas las concesionarias</h2>}
        {agencies.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No encontramos concesionarias con esos filtros.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => (
              <AgencyCard key={agency.userId} agency={agency} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

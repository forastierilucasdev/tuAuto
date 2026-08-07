import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { AgencyFilters } from "@/components/vehicles/AgencyFilters";
import { AgencyFiltersDrawer } from "@/components/vehicles/AgencyFiltersDrawer";
import { getAgencies, getFeaturedAgencies, type AgencyAccountType } from "@/server/data/agencies";
import { accountTypeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Concesionarias y Agencias" };

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

function AgencyGrid({ agencies }: { agencies: Agency[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {agencies.map((agency) => (
        <AgencyCard key={agency.userId} agency={agency} />
      ))}
    </div>
  );
}

const RESULTS_HEADING: Record<AgencyAccountType | "", string> = {
  CONCESIONARIA: "Todas las concesionarias",
  AGENCIA: "Todas las agencias",
  "": "Todos los resultados",
};

const EMPTY_MESSAGE: Record<AgencyAccountType | "", string> = {
  CONCESIONARIA: "No encontramos concesionarias con esos filtros.",
  AGENCIA: "No encontramos agencias con esos filtros.",
  "": "No encontramos concesionarias ni agencias con esos filtros.",
};

export default async function ConcesionariasPage(props: PageProps<"/concesionarias">) {
  const sp = await props.searchParams;
  const provincia = param(sp, "provincia") ?? "";
  const localidad = param(sp, "localidad") ?? "";
  const tipo = (param(sp, "tipo") as AgencyAccountType | undefined) ?? "";
  const hasFilters = Boolean(provincia || localidad || tipo);

  const [agencies, featuredConcesionarias, featuredAgencias] = await Promise.all([
    getAgencies({ province: provincia || undefined, city: localidad || undefined, accountType: tipo || undefined }),
    hasFilters ? Promise.resolve([]) : getFeaturedAgencies("CONCESIONARIA", 4),
    hasFilters ? Promise.resolve([]) : getFeaturedAgencies("AGENCIA", 4),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Concesionarias y Agencias</h1>
      <p className="mt-1 text-muted-foreground">Agencias y concesionarias que publican en Motoresya.</p>

      <div className="mt-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        <div className="hidden lg:block">
          <AgencyFilters />
        </div>

        <div>
          <AgencyFiltersDrawer />

          <div className="space-y-10">
            {!hasFilters && featuredConcesionarias.length > 0 && (
              <section>
                <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-navy">
                  <Star className="h-5 w-5 fill-current text-warning" />
                  Concesionarias destacadas
                </h2>
                <AgencyGrid agencies={featuredConcesionarias} />
              </section>
            )}

            {!hasFilters && featuredAgencias.length > 0 && (
              <section>
                <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-navy">
                  <Star className="h-5 w-5 fill-current text-warning" />
                  Agencias destacadas
                </h2>
                <AgencyGrid agencies={featuredAgencias} />
              </section>
            )}

            <section>
              <h2 className="mb-4 text-lg font-bold text-navy">{RESULTS_HEADING[tipo]}</h2>
              {agencies.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                  {EMPTY_MESSAGE[tipo]}
                </p>
              ) : (
                <AgencyGrid agencies={agencies} />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

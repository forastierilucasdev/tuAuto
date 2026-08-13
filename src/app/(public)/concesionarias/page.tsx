import type { Metadata } from "next";
import { Star } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { AgencyCard, type Agency } from "@/components/vehicles/AgencyCard";
import { AgencyFilters } from "@/components/vehicles/AgencyFilters";
import { AgencyFiltersDrawer } from "@/components/vehicles/AgencyFiltersDrawer";
import { getAgencies, getFeaturedAgencies, type AgencyAccountType } from "@/server/data/agencies";

export const metadata: Metadata = { title: "Concesionarias y Agencias" };

export const dynamic = "force-dynamic";

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

function AgencyGrid({ agencies }: { agencies: Agency[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
  // Las destacadas siguen al filtro de tipo (si elegís "Concesionarias" seguís
  // viendo las concesionarias destacadas), no a los filtros de texto
  // provincia/localidad — esos solo acotan el listado completo de abajo.
  const showConcesionariasDestacadas = tipo === "" || tipo === "CONCESIONARIA";
  const showAgenciasDestacadas = tipo === "" || tipo === "AGENCIA";

  const [agencies, featuredConcesionarias, featuredAgencias] = await Promise.all([
    getAgencies({ province: provincia || undefined, city: localidad || undefined, accountType: tipo || undefined }),
    showConcesionariasDestacadas ? getFeaturedAgencies("CONCESIONARIA", 4) : Promise.resolve([]),
    showAgenciasDestacadas ? getFeaturedAgencies("AGENCIA", 4) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-end">
        <BackButton href="/" />
      </div>

      <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Concesionarias y Agencias</h1>
      <p className="mt-1 text-muted-foreground">Agencias y concesionarias que publican en Motoresya.</p>

      <div className="mt-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        <div className="hidden lg:block">
          <AgencyFilters />
        </div>

        <div>
          <AgencyFiltersDrawer />

          <div className="space-y-10">
            {showConcesionariasDestacadas && featuredConcesionarias.length > 0 && (
              <section>
                <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-navy">
                  <Star className="h-5 w-5 fill-current text-warning" />
                  Concesionarias destacadas
                </h2>
                <AgencyGrid agencies={featuredConcesionarias} />
              </section>
            )}

            {showAgenciasDestacadas && featuredAgencias.length > 0 && (
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

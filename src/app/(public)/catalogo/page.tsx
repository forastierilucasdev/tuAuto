import type { Metadata } from "next";
import Link from "next/link";
import { CatalogFilters } from "@/components/vehicles/CatalogFilters";
import { CatalogFiltersDrawer } from "@/components/vehicles/CatalogFiltersDrawer";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { getCatalogResults } from "@/server/data/listings";
import type { AccountType, Currency, VehicleCondition, VehicleType } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Catálogo" };

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

function paramNumber(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = param(sp, key);
  const parsed = value ? Number(value) : undefined;
  return parsed !== undefined && !Number.isNaN(parsed) ? parsed : undefined;
}

export default async function CatalogoPage(props: PageProps<"/catalogo">) {
  const sp = await props.searchParams;

  const filters = {
    vehicleType: param(sp, "tipo") as VehicleType | undefined,
    brandSlug: param(sp, "marca"),
    modelSlug: param(sp, "modelo"),
    year: paramNumber(sp, "anio"),
    condition: param(sp, "condicion") as VehicleCondition | undefined,
    currency: param(sp, "moneda") as Currency | undefined,
    minPrice: paramNumber(sp, "precioMin"),
    maxPrice: paramNumber(sp, "precioMax"),
    minKm: paramNumber(sp, "kmMin"),
    maxKm: paramNumber(sp, "kmMax"),
    sellerAccountType: param(sp, "vendedor") as AccountType | undefined,
  };

  const page = paramNumber(sp, "pagina") ?? 1;
  const { featured, rest, restTotal, totalPages } = await getCatalogResults(filters, page);
  const total = featured.length + restTotal;

  const pagerParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "pagina" || value === undefined) continue;
    pagerParams.set(key, Array.isArray(value) ? value[0] : value);
  }
  function pageHref(targetPage: number) {
    const params = new URLSearchParams(pagerParams);
    if (targetPage > 1) params.set("pagina", String(targetPage));
    const query = params.toString();
    return query ? `/catalogo?${query}` : "/catalogo";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Catálogo</h1>
      <p className="mt-1 text-muted-foreground">
        {total} publicaci{total === 1 ? "ón encontrada" : "ones encontradas"}
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        <div className="hidden lg:block">
          <CatalogFilters />
        </div>

        <div>
          <CatalogFiltersDrawer />

          <div className="space-y-10">
            {featured.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-bold text-navy">Publicaciones destacadas</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {featured.map((vehicle) => (
                    <VehicleCard key={vehicle.slug} vehicle={vehicle} />
                  ))}
                </div>
              </section>
            )}

            <section>
              {featured.length > 0 && rest.length > 0 && (
                <h2 className="mb-4 text-lg font-bold text-navy">Resto del catálogo</h2>
              )}
              {total === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                  No encontramos publicaciones con esos filtros. Probá ajustarlos.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {rest.map((vehicle) => (
                    <VehicleCard key={vehicle.slug} vehicle={vehicle} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  {page > 1 ? (
                    <Link
                      href={pageHref(page - 1)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
                    >
                      Anterior
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">
                      Anterior
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      href={pageHref(page + 1)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
                    >
                      Siguiente
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">
                      Siguiente
                    </span>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

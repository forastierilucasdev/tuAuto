"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CatalogFilters } from "@/components/vehicles/CatalogFilters";
import { cn } from "@/lib/utils";

/**
 * En mobile los filtros viven en un panel que se desliza desde la izquierda
 * en vez de ocupar espacio fijo arriba de los resultados. El mismo botón
 * "Filtros" abre y cierra el panel; también se cierra con la cruz, tocando
 * el fondo, o al aplicar los filtros. En desktop (`lg:` en adelante) no se
 * renderiza nada acá — el catálogo usa `CatalogFilters` directo en la
 * barra lateral fija.
 */
export function CatalogFiltersDrawer() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-card"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de búsqueda"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-background p-4 shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold text-navy">Filtros</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar filtros"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <CatalogFilters onApply={() => setOpen(false)} />
      </div>
    </div>
  );
}

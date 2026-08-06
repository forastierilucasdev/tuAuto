"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { CatalogFilters } from "@/components/vehicles/CatalogFilters";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";

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

      <SlideOverPanel open={open} onClose={() => setOpen(false)} side="left" title="Filtros">
        <CatalogFilters onApply={() => setOpen(false)} />
      </SlideOverPanel>
    </div>
  );
}

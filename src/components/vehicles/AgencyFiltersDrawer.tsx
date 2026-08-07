"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { AgencyFilters } from "@/components/vehicles/AgencyFilters";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";

/** Mismo patrón que `CatalogFiltersDrawer`: panel deslizable en mobile, sidebar fija en desktop. */
export function AgencyFiltersDrawer() {
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
        <AgencyFilters onApply={() => setOpen(false)} />
      </SlideOverPanel>
    </div>
  );
}

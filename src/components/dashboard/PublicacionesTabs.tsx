"use client";

import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import { PUBLICACIONES_TABS, type PublicacionesTabKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

type TabKey = PublicacionesTabKey | "todas";

type Counts = Record<TabKey, number>;

function tabHref(key: TabKey) {
  return `/dashboard/publicaciones?tab=${key}`;
}

export function PublicacionesTabs({ activeTab, counts }: { activeTab: TabKey; counts: Counts }) {
  const [open, setOpen] = React.useState(false);
  const activeLabel = activeTab === "todas" ? "Todos" : PUBLICACIONES_TABS.find((t) => t.key === activeTab)?.label ?? "";

  return (
    <>
      {/* Desktop: barra de pestañas a ancho completo (antes quedaban pegadas
          a la izquierda, dejando espacio vacío sin usar). */}
      <div className="mt-6 hidden border-b border-border md:flex">
        {PUBLICACIONES_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tabHref(tab.key)}
            // Reemplaza la entrada del historial en vez de apilar una nueva
            // — si no, "Volver" hace recorrer pestaña por pestaña.
            replace
            className={cn(
              "flex-1 border-b-2 px-4 py-2 text-center text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label} ({counts[tab.key]})
          </Link>
        ))}
      </div>

      {/* Mobile: en vez de una barra que hay que desplazar horizontalmente,
          un botón "Filtros" (mismo patrón que el catálogo) abre un panel con
          la lista completa una debajo de otra — tocar una opción aplica al
          toque, sin botón "Aplicar". */}
      <div className="mt-6 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-card"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros: {activeLabel} ({counts[activeTab]})
        </button>

        <SlideOverPanel open={open} onClose={() => setOpen(false)} side="left" title="Filtros">
          <nav className="space-y-1">
            <Link
              href={tabHref("todas")}
              replace
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                activeTab === "todas" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-muted"
              )}
            >
              Todos ({counts.todas})
            </Link>
            {PUBLICACIONES_TABS.map((tab) => (
              <Link
                key={tab.key}
                href={tabHref(tab.key)}
                replace
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.key ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-muted"
                )}
              >
                {tab.label} ({counts[tab.key]})
              </Link>
            ))}
          </nav>
        </SlideOverPanel>
      </div>
    </>
  );
}

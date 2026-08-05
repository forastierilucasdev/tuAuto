"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type VerticalTabItem = {
  id: string;
  label: string;
  // Ícono ya renderizado (ej. `<Info className="h-4 w-4" />`), no el
  // componente en sí: una referencia a función no es serializable al cruzar
  // el límite Server -> Client Component.
  icon?: React.ReactNode;
  content: React.ReactNode;
};

/**
 * En mobile no hay pestañas: todas las secciones se listan una debajo de la
 * otra (con un ícono + título liviano, sin botones/píldoras) para aprovechar
 * el scroll vertical natural del teléfono y no esconder información detrás
 * de un click. En desktop (`sm:` en adelante) se comporta como pestañas
 * verticales clásicas: una barra lateral y un panel con la sección activa.
 * Mismo componente, dos layouts vía CSS (`sm:hidden` / `hidden sm:flex`) —
 * sin duplicar el contenido de cada sección.
 */
export function VerticalTabs({
  tabs,
  defaultTabId,
}: {
  tabs: VerticalTabItem[];
  defaultTabId?: string;
}) {
  const [active, setActive] = React.useState(defaultTabId ?? tabs[0]?.id);
  const activeTab = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div>
      {/* Mobile: secciones apiladas en cajas separadas, siempre visibles */}
      <div className="space-y-4 sm:hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="rounded-2xl border border-border bg-surface p-4 shadow-card"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
              {tab.icon}
              {tab.label}
            </h3>
            {tab.content}
          </div>
        ))}
      </div>

      {/* Desktop: pestañas verticales clásicas */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-card sm:flex">
        <div className="flex w-56 shrink-0 flex-col gap-1 border-r border-border p-3">
          {tabs.map((tab) => {
            const isActive = activeTab?.id === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                )}
              >
                {tab.icon}
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="min-w-0 flex-1 p-5">{activeTab?.content}</div>
      </div>
    </div>
  );
}

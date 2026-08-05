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
 * Pestañas verticales en desktop (una sección a la vez) que se convierten en
 * una fila horizontal scrolleable en mobile — mismo componente, layout
 * distinto vía flexbox (`flex-col sm:flex-row`), reutilizable en cualquier
 * pantalla que necesite este patrón.
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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card sm:flex-row">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 sm:w-56 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:p-3">
        {tabs.map((tab) => {
          const isActive = activeTab?.id === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
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
  );
}

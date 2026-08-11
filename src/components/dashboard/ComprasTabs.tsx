"use client";

import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import { cn } from "@/lib/utils";

export type ComprasTabKey = "individual" | "suscripcion" | "historial";

// "Pago individual" y "Suscripciones" son pestañas en la misma página
// (`?vista=`); "Historial de pagos" en cambio navega a una página aparte,
// bien simple, con su propio botón Volver — por eso es un href distinto en
// vez de un query param más.
const TABS: { key: ComprasTabKey; label: string; href: string }[] = [
  { key: "individual", label: "Pago individual", href: "/dashboard/compra?vista=individual" },
  { key: "suscripcion", label: "Suscripciones", href: "/dashboard/compra?vista=suscripcion" },
  { key: "historial", label: "Historial de pagos", href: "/dashboard/compra/historial" },
];

/** Sub-nav de "Mis compras" — mismo lenguaje visual que `AnunciosSubNav`/`PublicacionesTabs`. */
export function ComprasTabs({ active }: { active: ComprasTabKey }) {
  const [open, setOpen] = React.useState(false);
  const activeLabel = TABS.find((t) => t.key === active)?.label ?? "";

  return (
    <div className="mb-6">
      <div className="hidden border-b border-border md:flex">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "flex-1 border-b-2 px-4 py-2 text-center text-sm font-medium transition-colors",
              active === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-card"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeLabel}
        </button>

        <SlideOverPanel open={open} onClose={() => setOpen(false)} side="left" title="Mis compras">
          <nav className="space-y-1">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  active === t.key ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-muted"
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </SlideOverPanel>
      </div>
    </div>
  );
}

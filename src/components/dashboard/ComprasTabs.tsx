import Link from "next/link";
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

/** Sub-nav de "Mis compras" — mismo lenguaje visual que `AnunciosSubNav`/`PublicacionesTabs` en desktop. */
export function ComprasTabs({ active }: { active: ComprasTabKey }) {
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

      {/* Mobile: las 3 opciones siempre visibles, apiladas y del mismo ancho
          (antes había que abrir un panel de filtros aparte para verlas) —
          el punto relleno funciona como indicador tipo radio de cuál está
          activa. */}
      <div className="space-y-2 md:hidden">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
              active === t.key
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-foreground hover:bg-surface-muted"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                active === t.key ? "border-primary" : "border-muted-foreground"
              )}
            >
              {active === t.key && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

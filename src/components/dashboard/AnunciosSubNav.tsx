"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import { cn } from "@/lib/utils";

// 3 rutas distintas (no una sola página con tabs internos) para no romper los
// `revalidatePath` que ya apuntan a `/dashboard/publicaciones` en todo
// `listing.actions.ts`/`payment.actions.ts`. Cada una con su propio color
// (tipo fichero/carpeta) para ubicarse de un vistazo, en vez de las 3 con el
// mismo azul.
const SECTIONS = [
  {
    href: "/dashboard/anuncios",
    label: "Resumen",
    border: "border-primary",
    text: "text-primary",
    tint: "bg-primary/10 text-primary",
  },
  {
    href: "/dashboard/publicaciones",
    label: "Mis publicaciones",
    border: "border-success",
    text: "text-success",
    tint: "bg-success/10 text-success",
  },
  {
    href: "/dashboard/compra",
    label: "Mis compras",
    border: "border-warning",
    text: "text-warning",
    tint: "bg-warning/10 text-warning",
  },
] as const;

/** Sub-nav de "Administrador de anuncios" — mismo lenguaje visual que `PublicacionesTabs`. */
export function AnunciosSubNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const active = SECTIONS.find((s) => s.href === pathname) ?? SECTIONS[0];

  return (
    <div className="mb-6">
      <div className="hidden border-b border-border md:flex">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "flex-1 border-b-2 px-4 py-2 text-center text-sm font-medium transition-colors",
              pathname === s.href
                ? cn(s.border, s.text)
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-card",
            active.border,
            active.text,
            "bg-surface"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {active.label}
        </button>

        <SlideOverPanel open={open} onClose={() => setOpen(false)} side="left" title="Administrador de anuncios">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  pathname === s.href ? s.tint : "text-foreground hover:bg-surface-muted"
                )}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </SlideOverPanel>
      </div>
    </div>
  );
}

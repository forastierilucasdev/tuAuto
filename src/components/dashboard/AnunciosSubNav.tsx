"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import { cn } from "@/lib/utils";

// 3 rutas distintas (no una sola página con tabs internos) para no romper los
// `revalidatePath` que ya apuntan a `/dashboard/publicaciones` en todo
// `listing.actions.ts`/`payment.actions.ts`.
const SECTIONS = [
  { href: "/dashboard/anuncios", label: "Resumen" },
  { href: "/dashboard/publicaciones", label: "Mis publicaciones" },
  { href: "/dashboard/compra", label: "Mis compras" },
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
                ? "border-primary text-primary"
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
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-card"
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
                  pathname === s.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-muted"
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

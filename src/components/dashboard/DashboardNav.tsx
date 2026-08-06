"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/perfil", label: "Mi perfil" },
  { href: "/dashboard/publicaciones", label: "Mis publicaciones" },
  { href: "/dashboard/pago", label: "Método de pago" },
];

/**
 * En mobile la barra lateral quedaba oculta sin ningún reemplazo, dejando el
 * dashboard sin forma de navegar a "Mi perfil" etc. desde el celular. Esta
 * fila horizontal scrolleable, debajo del header, cubre ese caso. En
 * desktop (`md:` en adelante) no se renderiza — ahí se usa DashboardSidebarNav.
 */
export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-surface md:hidden">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Barra lateral vertical clásica, solo en desktop (`md:` en adelante). */
export function DashboardSidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-surface text-primary" : "text-foreground/80 hover:bg-surface hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

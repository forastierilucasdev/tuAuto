"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Los 3 roles leen todos los módulos (ver `lib/admin-permissions.ts` — todos
// tienen al menos "read" en todo) — no hace falta filtrar el nav por rol.
const NAV = [
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/identidad", label: "Identidad" },
  { href: "/admin/publicaciones", label: "Publicaciones" },
  { href: "/admin/suscripciones", label: "Suscripciones y Pagos" },
  { href: "/admin/destacados", label: "Destacados" },
  { href: "/admin/vehiculos", label: "Vehículos" },
  { href: "/admin/auditoria", label: "Auditoría" },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

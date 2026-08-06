"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/layout/AccountMenu";

const NAV = [
  { href: "/dashboard/perfil", label: "Mi perfil" },
  { href: "/dashboard/publicaciones", label: "Mis publicaciones" },
  { href: "/dashboard/pago", label: "Método de pago" },
];

/**
 * Barra lateral vertical, solo en desktop (`md:` en adelante). En mobile el
 * único acceso a estas secciones es el `AccountMenu` del header del
 * dashboard — tener además esta lista horizontal ahí era redundante.
 */
export function DashboardSidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <div className="mb-4 flex justify-center border-b border-border pb-4">
        <AccountMenu avatarSize="md" />
      </div>
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

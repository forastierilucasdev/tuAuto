"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/generated/prisma/client";

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPERADMIN: "Superadministrador",
  EDITOR: "Editor",
  LECTOR: "Lector",
};

const MOBILE_NAV = [
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/identidad", label: "Identidad" },
  { href: "/admin/publicaciones", label: "Publicaciones" },
  { href: "/admin/suscripciones", label: "Suscripciones" },
  { href: "/admin/destacados", label: "Destacados" },
  { href: "/admin/vehiculos", label: "Vehículos" },
  { href: "/admin/auditoria", label: "Auditoría" },
];

export function AdminHeader({ adminRole }: { adminRole: AdminRole }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-lg font-bold text-navy">
            Motoresya <span className="text-muted-foreground">Admin</span>
          </Link>
          <Badge variant="info">{ROLE_LABEL[adminRole]}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Volver al sitio
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-border px-4 py-2 sm:px-6 md:hidden">
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 whitespace-nowrap text-sm font-medium",
              pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

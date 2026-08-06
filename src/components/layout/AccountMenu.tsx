"use client";

import * as React from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { CreditCard, FileText, LogOut, PlusCircle, User as UserIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import { getMyProfileAction } from "@/server/actions/profile.actions";
import { cn } from "@/lib/utils";

type Profile = Awaited<ReturnType<typeof getMyProfileAction>>;

const MENU_ITEMS = [
  { href: "/dashboard/perfil", label: "Mi perfil", icon: UserIcon },
  { href: "/dashboard/publicaciones", label: "Mis publicaciones", icon: FileText },
  { href: "/dashboard/pago", label: "Método de pago", icon: CreditCard },
  { href: "/dashboard/publicaciones/nueva", label: "Publicar anuncio", icon: PlusCircle },
];

const itemClasses =
  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted";

type AccountMenuProps = {
  /** "md" para verlo más grande — se usa en la barra lateral de desktop. */
  avatarSize?: "sm" | "md";
  /** "Bienvenido, {nombre}" al lado del avatar — header público en desktop. */
  showGreeting?: boolean;
};

/**
 * Ícono de cuenta (foto o iniciales) que abre, desde la izquierda, un menú
 * de navegación vertical hacia las pantallas de la cuenta — mismo mecanismo
 * que el drawer de filtros del catálogo (`SlideOverPanel`, `side="left"`).
 */
export function AccountMenu({ avatarSize = "sm", showGreeting = false }: AccountMenuProps) {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile>(null);

  React.useEffect(() => {
    if (session?.user) getMyProfileAction().then(setProfile);
  }, [session?.user]);

  if (!session?.user) return null;

  // Para cuentas de negocio se saluda con el nombre comercial, no el nombre
  // personal del titular de la cuenta.
  const displayName = profile?.agencyProfile?.businessName ?? profile?.fullName ?? session.user.name ?? "";

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mi cuenta"
          className="inline-flex items-center justify-center rounded-full hover:opacity-80"
        >
          <UserAvatar avatarUrl={profile?.avatarUrl} fullName={displayName} size={avatarSize} />
        </button>
        {showGreeting && displayName && (
          <span className="hidden text-sm font-medium text-foreground md:inline">
            Bienvenido, {displayName}
          </span>
        )}
      </div>

      <SlideOverPanel open={open} onClose={() => setOpen(false)} side="left" title="Mi cuenta">
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={itemClasses}>
              <item.icon className="h-5 w-5 text-muted-foreground" />
              {item.label}
            </Link>
          ))}

          <hr className="my-2 border-border" />

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className={cn(itemClasses, "text-danger hover:bg-danger/10")}
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </nav>
      </SlideOverPanel>
    </>
  );
}

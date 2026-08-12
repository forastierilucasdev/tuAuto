"use client";

import * as React from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { CreditCard, KeyRound, LayoutDashboard, LogOut, PlusCircle, Repeat, ShoppingBag, User as UserIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import { getMyProfileAction } from "@/server/actions/profile.actions";
import { cn } from "@/lib/utils";

type Profile = Awaited<ReturnType<typeof getMyProfileAction>>;

// "Publicar anuncio" no vive acá — se renderiza aparte, justo debajo del
// nombre, como acceso destacado (ver más abajo).
const TOP_ITEMS = [
  { href: "/dashboard/perfil", label: "Mi perfil", icon: UserIcon },
  { href: "/dashboard/anuncios", label: "Administrador de anuncios", icon: LayoutDashboard },
];

// Accesos directos a comprar, para no tener que pasar por "Administrador de
// anuncios" primero — van agrupados bajo su propia etiqueta.
const ANUNCIOS_ITEMS = [
  { href: "/dashboard/compra?vista=individual", label: "Compra individual", icon: ShoppingBag },
  { href: "/dashboard/compra?vista=suscripcion", label: "Compra suscripción", icon: Repeat },
  { href: "/dashboard/pago", label: "Método de pago", icon: CreditCard },
];

const BOTTOM_ITEMS = [{ href: "/dashboard/perfil/password", label: "Cambiar contraseña", icon: KeyRound }];

const itemClasses =
  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted";

type AccountMenuProps = {
  /** "md" para verlo más grande — se usa en la barra lateral de desktop. */
  avatarSize?: "sm" | "md";
  /** "Bienvenido, {nombre}" al lado del avatar — header público en desktop. */
  showGreeting?: boolean;
  /** Desde qué borde entra el panel — "right" cuando el avatar está pegado a la derecha del todo. */
  panelSide?: "left" | "right";
};

export type AccountMenuHandle = { open: () => void };

/**
 * Ícono de cuenta (foto o iniciales) que abre un menú de navegación vertical
 * hacia las pantallas de la cuenta — mismo mecanismo que el drawer de
 * filtros del catálogo (`SlideOverPanel`). `panelSide` controla desde qué
 * borde entra, para que abra "desde donde tocaste" según en qué lado del
 * header viva el avatar.
 *
 * Expone `open()` por ref para que otro disparador (ej. "Mi cuenta" en el
 * menú hamburguesa mobile de `Header`) pueda abrir este mismo panel en vez
 * de duplicarlo.
 */
export const AccountMenu = React.forwardRef<AccountMenuHandle, AccountMenuProps>(function AccountMenu(
  { avatarSize = "sm", showGreeting = false, panelSide = "left" },
  ref
) {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile>(null);

  React.useImperativeHandle(ref, () => ({ open: () => setOpen(true) }));

  React.useEffect(() => {
    if (session?.user) getMyProfileAction().then(setProfile);
  }, [session?.user]);

  if (!session?.user) return null;

  // Para cuentas de negocio se saluda con el nombre comercial, no el nombre
  // personal del titular de la cuenta.
  const isBusinessName = Boolean(profile?.agencyProfile?.businessName);
  const displayName = profile?.agencyProfile?.businessName ?? profile?.fullName ?? session.user.name ?? "";
  // El saludo del header va solo con el primer nombre para no ocupar tanto
  // espacio ("Bienvenido, Emiliano" en vez de "Bienvenido, Emiliano
  // Insaurralde") — un nombre comercial ya es una sola identidad corta, así
  // que ese no se recorta. El nombre completo se ve igual dentro del panel
  // "Mi cuenta".
  const greetingName = isBusinessName ? displayName : displayName.split(" ")[0];

  return (
    <>
      <div className="flex items-center gap-2">
        {showGreeting && greetingName && (
          <span className="hidden text-sm font-medium text-foreground md:inline">
            Bienvenido, {greetingName}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mi cuenta"
          className="inline-flex items-center justify-center rounded-full hover:opacity-80"
        >
          <UserAvatar avatarUrl={profile?.avatarUrl} fullName={displayName} size={avatarSize} />
        </button>
      </div>

      <SlideOverPanel open={open} onClose={() => setOpen(false)} side={panelSide} title="Mi cuenta">
        {displayName && (
          <>
            <p className="px-3 pb-3 text-sm font-medium text-foreground">{displayName}</p>
            <Link href="/dashboard/publicaciones/nueva" onClick={() => setOpen(false)} className={itemClasses}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <PlusCircle className="h-5 w-5" />
              </span>
              Publicar anuncio
            </Link>
            <hr className="mb-2 border-border" />
          </>
        )}
        <nav className="space-y-1">
          {TOP_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={itemClasses}>
              <item.icon className="h-5 w-5 text-muted-foreground" />
              {item.label}
            </Link>
          ))}

          <hr className="my-2 border-border" />
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anuncios</p>
          {ANUNCIOS_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={itemClasses}>
              <item.icon className="h-5 w-5 text-muted-foreground" />
              {item.label}
            </Link>
          ))}

          {BOTTOM_ITEMS.map((item) => (
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
});

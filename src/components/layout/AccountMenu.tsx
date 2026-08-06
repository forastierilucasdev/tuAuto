"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CreditCard, FileText, User as UserIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import { getMyProfileAction } from "@/server/actions/profile.actions";

type Profile = Awaited<ReturnType<typeof getMyProfileAction>>;

const MENU_ITEMS = [
  { href: "/dashboard/perfil", label: "Mi perfil", icon: UserIcon },
  { href: "/dashboard/publicaciones", label: "Mis publicaciones", icon: FileText },
  { href: "/dashboard/pago", label: "Método de pago", icon: CreditCard },
];

/**
 * Ícono de cuenta (foto o iniciales) que abre, desde la izquierda, un menú
 * de navegación vertical hacia las pantallas de la cuenta — mismo mecanismo
 * que el drawer de filtros del catálogo (`SlideOverPanel`, `side="left"`).
 */
export function AccountMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile>(null);

  React.useEffect(() => {
    if (session?.user) getMyProfileAction().then(setProfile);
  }, [session?.user]);

  if (!session?.user) return null;

  const displayName = profile?.fullName ?? session.user.name ?? "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mi cuenta"
        className="inline-flex items-center justify-center rounded-full hover:opacity-80"
      >
        <UserAvatar avatarUrl={profile?.avatarUrl} fullName={displayName} size="sm" />
      </button>

      <SlideOverPanel open={open} onClose={() => setOpen(false)} side="left" title="Mi cuenta">
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SlideOverPanel>
    </>
  );
}

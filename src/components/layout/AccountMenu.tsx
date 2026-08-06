"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { getMyProfileAction } from "@/server/actions/profile.actions";

type Profile = Awaited<ReturnType<typeof getMyProfileAction>>;

/**
 * Botón de cuenta (foto o iniciales + "Mi perfil") que abre un panel
 * deslizable desde la derecha con el mismo `ProfileForm` que usa la página
 * completa /dashboard/perfil — una sola fuente de verdad para el formulario,
 * reutilizada acá como atajo rápido sin salir de la página actual.
 */
export function AccountMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile>(null);

  const refetch = React.useCallback(() => {
    getMyProfileAction().then(setProfile);
  }, []);

  React.useEffect(() => {
    if (session?.user) refetch();
  }, [session?.user, refetch]);

  if (!session?.user) return null;

  const displayName = profile?.fullName ?? session.user.name ?? "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-1 py-1 text-foreground hover:bg-surface-muted md:px-2"
      >
        <span className="flex flex-col items-center gap-0.5 md:flex-row md:gap-2">
          <UserAvatar avatarUrl={profile?.avatarUrl} fullName={displayName} size="sm" />
          <span className="text-[11px] font-medium leading-none md:text-sm">Mi perfil</span>
        </span>
      </button>

      <SlideOverPanel open={open} onClose={() => setOpen(false)} side="right" title="Mi perfil">
        {profile ? (
          <ProfileForm
            accountType={profile.accountType}
            email={profile.email}
            dni={profile.dni}
            fullName={profile.fullName}
            phone={profile.phone}
            avatarUrl={profile.avatarUrl}
            agency={profile.agencyProfile}
            onSaved={refetch}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        )}
      </SlideOverPanel>
    </>
  );
}

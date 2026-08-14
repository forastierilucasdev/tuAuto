import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getFullProfile, isUserSuspended } from "@/server/data/users";
import { AccountTypeForm } from "@/components/forms/AccountTypeForm";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Tipo de cuenta" };

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AccountTypePage() {
  const session = await auth();
  const profile = await getFullProfile(session!.user.id);
  if (!profile) return null;

  const suspended = isUserSuspended(profile.suspendedUntil);

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/dashboard/perfil" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Tipo de cuenta</h1>
      <p className="mt-1 text-muted-foreground">Particular, agencia o concesionaria.</p>

      <div className="mt-3 mb-6 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Estado de la cuenta:</span>
        {!profile.isActive ? (
          <Badge variant="danger">Baneada</Badge>
        ) : suspended ? (
          <Badge variant="danger">Suspendida</Badge>
        ) : (
          <Badge variant="success">Activo</Badge>
        )}
      </div>

      {suspended && (
        <div className="mb-6 rounded-2xl border border-danger/40 bg-danger/5 p-4 text-sm">
          <p className="font-semibold text-foreground">Tu cuenta está suspendida</p>
          <p className="mt-1 text-muted-foreground">
            Hasta el {dateTimeFormatter.format(profile.suspendedUntil!)}, tus publicaciones no se muestran en el
            catálogo y no podés publicar ni reactivar ninguna. Se reactiva sola al llegar esa fecha.
          </p>
          {profile.suspensionReason && (
            <p className="mt-2 text-muted-foreground">
              <span className="font-medium text-foreground">Motivo:</span> {profile.suspensionReason}
            </p>
          )}
        </div>
      )}

      <AccountTypeForm
        accountType={profile.accountType}
        fullName={profile.fullName}
        dni={profile.dni}
        phone={profile.phone}
        agency={profile.agencyProfile}
      />
    </div>
  );
}

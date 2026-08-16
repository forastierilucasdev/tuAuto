import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getFullProfile, getLatestVerificationRequest } from "@/server/data/users";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { BackButton } from "@/components/ui/BackButton";
import { buttonVariants } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const session = await auth();
  const [profile, latestRequest] = await Promise.all([
    getFullProfile(session!.user.id),
    getLatestVerificationRequest(session!.user.id),
  ]);

  if (!profile) return null;

  const pendingVerification = latestRequest?.status === "PENDING";

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Mi perfil</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Gestioná los datos de tu cuenta.</p>

      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Verificación de identidad</p>
            {profile.isVerified ? (
              <Badge variant="success">Perfil verificado</Badge>
            ) : pendingVerification ? (
              <Badge variant="info">Pendiente de revisión</Badge>
            ) : (
              <p className="text-xs text-muted-foreground">Todavía no verificaste tu perfil.</p>
            )}
          </div>
        </div>
        {!profile.isVerified && !pendingVerification && (
          <Link href="/dashboard/perfil/verificar" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Verificar perfil
          </Link>
        )}
      </div>

      <ProfileForm
        accountType={profile.accountType}
        email={profile.email}
        dni={profile.dni}
        fullName={profile.fullName}
        phone={profile.phone}
        avatarUrl={profile.avatarUrl}
        avatarPositionX={profile.avatarPositionX}
        avatarPositionY={profile.avatarPositionY}
        isVerified={profile.isVerified}
        agency={profile.agencyProfile}
      />
    </div>
  );
}

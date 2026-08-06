import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getFullProfile, getLatestVerificationRequest } from "@/server/data/users";
import { VerificationForm } from "@/components/forms/VerificationForm";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Verificar perfil" };

export default async function VerificarPerfilPage() {
  const session = await auth();
  const [profile, latestRequest] = await Promise.all([
    getFullProfile(session!.user.id),
    getLatestVerificationRequest(session!.user.id),
  ]);
  if (!profile) return null;

  const pending = latestRequest?.status === "PENDING";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Verificar perfil</h1>
          <p className="mt-1 mb-6 text-muted-foreground">
            Verificá tu identidad para que los compradores vean tu perfil como confiable.
          </p>
        </div>
        <BackButton />
      </div>

      {profile.isVerified ? (
        <p className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center text-success">
          Tu perfil ya está verificado.
        </p>
      ) : pending ? (
        <p className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center text-primary">
          Ya enviaste tu documentación y está pendiente de revisión. Te contactaremos por nuestro canal
          oficial si es necesario.
        </p>
      ) : (
        <VerificationForm defaultFullName={profile.fullName} defaultDni={profile.dni} defaultPhone={profile.phone} />
      )}
    </div>
  );
}

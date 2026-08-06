import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getFullProfile } from "@/server/data/users";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const session = await auth();
  const profile = await getFullProfile(session!.user.id);

  if (!profile) return null;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Mi perfil</h1>
          <p className="mt-1 mb-6 text-muted-foreground">Gestioná los datos de tu cuenta.</p>
        </div>
        <BackButton />
      </div>

      <ProfileForm
        accountType={profile.accountType}
        email={profile.email}
        dni={profile.dni}
        fullName={profile.fullName}
        phone={profile.phone}
        avatarUrl={profile.avatarUrl}
        agency={profile.agencyProfile}
      />
    </div>
  );
}

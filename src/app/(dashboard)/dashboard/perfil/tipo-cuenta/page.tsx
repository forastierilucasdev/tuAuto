import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getFullProfile } from "@/server/data/users";
import { AccountTypeForm } from "@/components/forms/AccountTypeForm";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Tipo de cuenta" };

export default async function AccountTypePage() {
  const session = await auth();
  const profile = await getFullProfile(session!.user.id);
  if (!profile) return null;

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/dashboard/perfil" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Tipo de cuenta</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Particular, agencia o concesionaria.</p>
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

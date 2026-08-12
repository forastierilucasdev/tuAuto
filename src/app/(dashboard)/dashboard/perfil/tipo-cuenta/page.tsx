import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getFullProfile } from "@/server/data/users";
import { AccountTypeForm } from "@/components/forms/AccountTypeForm";

export const metadata: Metadata = { title: "Tipo de cuenta" };

export default async function AccountTypePage() {
  const session = await auth();
  const profile = await getFullProfile(session!.user.id);
  if (!profile) return null;

  return (
    <div>
      <Link
        href="/dashboard/perfil"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mi perfil
      </Link>
      <h1 className="text-2xl font-bold text-navy">Tipo de cuenta</h1>
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

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getFullProfile } from "@/server/data/users";
import { isBusinessAccountType } from "@/lib/constants";
import { ListingForm } from "@/components/forms/ListingForm";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Publicar vehículo" };

export default async function NuevaPublicacionPage() {
  const session = await auth();
  const profile = await getFullProfile(session!.user.id);
  if (!profile) return null;

  return (
    <div>
      <div className="flex justify-end">
        <BackButton />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Publicar vehículo</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Completá los datos de tu vehículo. Podés publicar aunque no tengas una suscripción activa; para
        destacarlo, hacelo luego desde &quot;Método de pago&quot;.
      </p>
      <ListingForm
        mode="create"
        seller={{
          fullName: profile.fullName,
          phone: profile.phone,
          businessName: isBusinessAccountType(profile.accountType)
            ? profile.agencyProfile?.businessName
            : undefined,
        }}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { ListingForm } from "@/components/forms/ListingForm";

export const metadata: Metadata = { title: "Publicar vehículo" };

export default function NuevaPublicacionPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Publicar vehículo</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Completá los datos de tu vehículo. Podés publicar aunque no tengas una suscripción activa;
        para destacarlo, hacelo luego desde &quot;Método de pago&quot;.
      </p>
      <ListingForm mode="create" />
    </div>
  );
}

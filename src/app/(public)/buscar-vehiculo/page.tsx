import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";
import { VehicleRequestForm } from "@/components/forms/VehicleRequestForm";

export const metadata: Metadata = { title: "¿Buscás un auto en especial?" };

export default function BuscarVehiculoPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">¿Buscás un auto en especial?</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Dejanos tus datos de contacto y te avisaremos apenas se publique.
      </p>

      <Card>
        <CardContent className="pt-5">
          <VehicleRequestForm />
        </CardContent>
      </Card>
    </div>
  );
}

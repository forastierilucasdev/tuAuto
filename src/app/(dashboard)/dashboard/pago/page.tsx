import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getPaymentMethods } from "@/server/data/payments";
import { AddPaymentMethodForm } from "@/components/forms/AddPaymentMethodForm";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = { title: "Método de pago" };

export default async function PagoPage() {
  const session = await auth();
  const methods = await getPaymentMethods(session!.user.id);

  return (
    <div>
      <div className="flex justify-end">
        <BackButton />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Método de pago</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Un alias para identificar cómo pagás — el pago en sí siempre se hace en el checkout de
        Mercado Pago al confirmar una compra, no hace falta cargar datos de tarjeta acá.
      </p>

      <section>
        <h2 className="mb-4 text-lg font-bold text-navy">Métodos guardados</h2>
        {methods.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {methods.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">Mercado Pago</p>
              </div>
            ))}
          </div>
        )}
        <div className="max-w-sm">
          <AddPaymentMethodForm />
        </div>
      </section>
    </div>
  );
}

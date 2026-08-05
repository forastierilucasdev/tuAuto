"use client";

import { useActionState } from "react";
import { addPaymentMethodAction, type PaymentActionState } from "@/server/actions/payment.actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: PaymentActionState = undefined;

export function AddPaymentMethodForm() {
  const [state, formAction, pending] = useActionState(addPaymentMethodAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <Input name="label" placeholder="Alias, ej: Visa terminada en 4321" required />
        <Button type="submit" disabled={pending} variant="outline">
          {pending ? "Guardando..." : "Agregar"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}

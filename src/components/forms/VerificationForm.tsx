"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, IdCard } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { submitVerificationAction, type VerificationActionState } from "@/server/actions/verification.actions";

const initialState: VerificationActionState = undefined;

type VerificationFormProps = {
  defaultFullName: string;
  defaultDni: string;
  defaultPhone: string;
};

export function VerificationForm({ defaultFullName, defaultDni, defaultPhone }: VerificationFormProps) {
  const [state, formAction, pending] = useActionState(submitVerificationAction, initialState);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-lg font-bold text-navy">Documentación enviada</p>
        <p className="text-sm text-muted-foreground">
          Analizaremos tu documentación a la brevedad. Te contactaremos por nuestro canal oficial si es
          necesario. Muchas gracias.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-lg space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2 text-navy">
        <IdCard className="h-5 w-5" />
        <p className="font-semibold">Datos para verificar tu identidad</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Confirmá tus datos y subí una foto del frente y del dorso de tu DNI. Esta información se usa
        solo para verificar tu perfil y no se muestra públicamente.
      </p>

      <div>
        <Label htmlFor="fullName">Apellido y nombre</Label>
        <Input id="fullName" name="fullName" defaultValue={defaultFullName} required />
        <FieldError messages={state?.fieldErrors?.fullName} />
      </div>
      <div>
        <Label htmlFor="dni">DNI</Label>
        <Input id="dni" name="dni" defaultValue={defaultDni} required />
        <FieldError messages={state?.fieldErrors?.dni} />
      </div>
      <div>
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" defaultValue={defaultPhone} required />
        <FieldError messages={state?.fieldErrors?.phone} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="dniFront">DNI - Frente</Label>
          <input
            id="dniFront"
            name="dniFront"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            required
            className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm"
          />
        </div>
        <div>
          <Label htmlFor="dniBack">DNI - Dorso</Label>
          <input
            id="dniBack"
            name="dniBack"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            required
            className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Enviando..." : "Enviar para verificación"}
      </Button>
    </form>
  );
}

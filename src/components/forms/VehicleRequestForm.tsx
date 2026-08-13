"use client";

import { useActionState } from "react";
import { submitVehicleRequestAction, type VehicleRequestActionState } from "@/server/actions/vehicle-request.actions";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: VehicleRequestActionState = undefined;

export function VehicleRequestForm() {
  const [state, formAction, pending] = useActionState(submitVehicleRequestAction, initialState);

  if (state?.success) {
    return (
      <p className="text-sm text-success">
        ¡Muchas gracias! Te contactaremos cuando tengamos novedades.
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <Label htmlFor="fullName">Apellido y nombre</Label>
        <Input id="fullName" name="fullName" placeholder="Tu apellido y nombre" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+54 9 11 ..." required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" name="brand" placeholder="Ej: Volkswagen" required />
        </div>
        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" name="model" placeholder="Ej: Golf" required />
        </div>
      </div>

      <div>
        <Label className="mb-2">Año</Label>
        <div className="grid grid-cols-2 gap-4">
          <Input id="yearFrom" name="yearFrom" type="number" placeholder="Desde" aria-label="Año desde" required />
          <Input id="yearTo" name="yearTo" type="number" placeholder="Hasta" aria-label="Año hasta" required />
        </div>
      </div>

      <div>
        <Label className="mb-2">Kilometraje</Label>
        <div className="grid grid-cols-2 gap-4">
          <Input id="kmFrom" name="kmFrom" type="number" placeholder="Desde" aria-label="Km desde" required />
          <Input id="kmTo" name="kmTo" type="number" placeholder="Hasta" aria-label="Km hasta" required />
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Guardar y enviar"}
      </Button>
    </form>
  );
}

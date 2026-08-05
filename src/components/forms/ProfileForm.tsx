"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/server/actions/profile.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { isBusinessAccountType, type AccountTypeValue } from "@/lib/constants";

const initialState: ProfileActionState = undefined;

type ProfileFormProps = {
  accountType: AccountTypeValue;
  email: string;
  dni: string;
  fullName: string;
  phone: string;
  agency?: {
    businessName: string;
    cuit: string;
    city: string | null;
    province: string | null;
    description: string | null;
  } | null;
};

export function ProfileForm({ accountType, email, dni, fullName, phone, agency }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const isBusiness = isBusinessAccountType(accountType);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
        <div>
          <Label>DNI</Label>
          <Input value={dni} disabled />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        El email y el DNI no se pueden modificar desde acá. Escribinos a soporte si necesitás
        corregirlos.
      </p>

      {isBusiness && (
        <div>
          <Label htmlFor="businessName">
            Nombre de la {accountType === "CONCESIONARIA" ? "concesionaria" : "agencia"}
          </Label>
          <Input id="businessName" name="businessName" defaultValue={agency?.businessName} required />
          <FieldError messages={state?.fieldErrors?.businessName} />
        </div>
      )}

      <div>
        <Label htmlFor="fullName">Apellido y nombre</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
        <FieldError messages={state?.fieldErrors?.fullName} />
      </div>

      <div>
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" defaultValue={phone} required />
        <FieldError messages={state?.fieldErrors?.phone} />
      </div>

      {isBusiness && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" defaultValue={agency?.city ?? ""} />
            </div>
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" name="province" defaultValue={agency?.province ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={agency?.description ?? ""} />
          </div>
        </>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Perfil actualizado correctamente.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

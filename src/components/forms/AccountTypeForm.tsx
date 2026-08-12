"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { updateProfileAction, type ProfileActionState } from "@/server/actions/profile.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button, buttonVariants } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { ACCOUNT_TYPE_OPTIONS, isBusinessAccountType, type AccountTypeValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

const initialState: ProfileActionState = undefined;

type AccountTypeFormProps = {
  accountType: AccountTypeValue;
  fullName: string;
  dni: string;
  phone: string;
  agency?: {
    businessName: string;
    cuit: string;
    city: string | null;
    province: string | null;
    description: string | null;
    address: string | null;
    website: string | null;
  } | null;
};

/**
 * Pantalla propia para cambiar el tipo de cuenta (antes vivía como selector
 * inline en "Mi perfil"). Reusa `updateProfileAction` — manda como ocultos
 * los campos que no se editan acá (nombre/DNI/teléfono y, si ya era
 * negocio, ciudad/provincia/descripción/dirección/sitio web) para no
 * pisarlos con vacío.
 */
export function AccountTypeForm({ accountType: initialAccountType, fullName, dni, phone, agency }: AccountTypeFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [accountType, setAccountType] = React.useState<AccountTypeValue>(initialAccountType);
  const isBusiness = isBusinessAccountType(accountType);

  if (state?.success) {
    return (
      <div className="max-w-md space-y-4">
        <p className="text-sm text-success">Tu tipo de cuenta se actualizó correctamente.</p>
        <Link href="/dashboard/perfil" className={buttonVariants({ variant: "primary" })}>
          Volver a Mi perfil
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-5">
      <input type="hidden" name="fullName" value={fullName} />
      <input type="hidden" name="dni" value={dni} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="city" value={agency?.city ?? ""} />
      <input type="hidden" name="province" value={agency?.province ?? ""} />
      <input type="hidden" name="description" value={agency?.description ?? ""} />
      <input type="hidden" name="address" value={agency?.address ?? ""} />
      <input type="hidden" name="website" value={agency?.website ?? ""} />

      <div>
        <Label>Tipo de cuenta</Label>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-muted p-1 text-sm font-medium">
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAccountType(option.value)}
              className={cn(
                "rounded-md px-2 py-2 text-center transition-colors",
                accountType === option.value
                  ? "bg-surface text-primary shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {isBusinessAccountType(initialAccountType) && accountType === "PARTICULAR" && (
          <p className="mt-2 text-xs text-warning">
            Al pasar a Particular se elimina el perfil de{" "}
            {initialAccountType === "AGENCIA" ? "agencia" : "concesionaria"} (razón social, CUIT, ubicación).
          </p>
        )}
      </div>
      <input type="hidden" name="accountType" value={accountType} />

      {isBusiness && (
        <>
          <div>
            <Label htmlFor="businessName">
              Nombre de la {accountType === "CONCESIONARIA" ? "concesionaria" : "agencia"}
            </Label>
            <Input id="businessName" name="businessName" defaultValue={agency?.businessName} required />
            <FieldError messages={state?.fieldErrors?.businessName} />
          </div>
          <div>
            <Label htmlFor="cuit">CUIT</Label>
            <Input id="cuit" name="cuit" placeholder="30-71234567-1" defaultValue={agency?.cuit} required />
            <FieldError messages={state?.fieldErrors?.cuit} />
          </div>
        </>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

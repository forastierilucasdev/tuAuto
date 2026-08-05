"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/utils";
import { isBusinessAccountType, type AccountTypeValue } from "@/lib/constants";

const initialState: ActionState = undefined;

const ACCOUNT_TYPE_TOGGLE = [
  { value: "PARTICULAR", label: "Vendedor particular" },
  { value: "AGENCIA", label: "Agencia" },
  { value: "CONCESIONARIA", label: "Concesionaria" },
] as const satisfies ReadonlyArray<{ value: AccountTypeValue; label: string }>;

export function RegisterForm() {
  const [accountType, setAccountType] = useState<AccountTypeValue>("PARTICULAR");
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const isBusiness = isBusinessAccountType(accountType);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="accountType" value={accountType} />

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-muted p-1 text-sm font-medium">
        {ACCOUNT_TYPE_TOGGLE.map((option) => (
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

      {isBusiness && (
        <>
          <div>
            <Label htmlFor="businessName">
              Nombre de la {accountType === "CONCESIONARIA" ? "concesionaria" : "agencia"}
            </Label>
            <Input id="businessName" name="businessName" required />
            <FieldError messages={state?.fieldErrors?.businessName} />
          </div>
          <div>
            <Label htmlFor="cuit">CUIT</Label>
            <Input id="cuit" name="cuit" placeholder="30-71234567-1" required />
            <FieldError messages={state?.fieldErrors?.cuit} />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="fullName">Apellido y nombre</Label>
        <Input id="fullName" name="fullName" required />
        <FieldError messages={state?.fieldErrors?.fullName} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="dni">DNI</Label>
          <Input id="dni" name="dni" placeholder="30111222" required />
          <FieldError messages={state?.fieldErrors?.dni} />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" placeholder="+5491122334455" required />
          <FieldError messages={state?.fieldErrors?.phone} />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={state?.fieldErrors?.email} />
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Mínimo 8 caracteres, con al menos una letra y un número.
        </p>
        <FieldError messages={state?.fieldErrors?.password} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Ingresá acá
        </Link>
      </p>
    </form>
  );
}

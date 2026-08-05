"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/utils";

const initialState: ActionState = undefined;

type AccountType = "PARTICULAR" | "AGENCIA";

export function RegisterForm() {
  const [accountType, setAccountType] = useState<AccountType>("PARTICULAR");
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="accountType" value={accountType} />

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-1 text-sm font-medium">
        {(
          [
            { value: "PARTICULAR", label: "Vendedor particular" },
            { value: "AGENCIA", label: "Concesionaria / agencia" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setAccountType(option.value)}
            className={cn(
              "rounded-md px-3 py-2 transition-colors",
              accountType === option.value
                ? "bg-surface text-primary shadow-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {accountType === "AGENCIA" && (
        <>
          <div>
            <Label htmlFor="businessName">Nombre de la concesionaria / agencia</Label>
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

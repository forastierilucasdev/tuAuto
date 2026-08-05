"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordState } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";

const initialState: ForgotPasswordState = undefined;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-foreground">
          Si el email está registrado, te vamos a enviar instrucciones para recuperar tu
          contraseña.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={state?.fieldErrors?.email} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Enviando..." : "Enviar instrucciones"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </form>
  );
}

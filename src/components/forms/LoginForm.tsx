"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginAction } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { safeRedirectTarget } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  // Si `proxy.ts` te trajo acá por intentar entrar a una pantalla protegida
  // sin sesión, después de loguearte volvés ahí. Si no, a la pantalla
  // inicial (comportamiento por defecto pedido por el usuario).
  const callbackUrl = safeRedirectTarget(useSearchParams().get("callbackUrl"));

  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFieldErrors(undefined);

    const formData = new FormData(event.currentTarget);

    // Valida formato + rate limiting en el servidor antes de intentar el
    // sign-in real.
    const precheck = await loginAction(undefined, formData);
    if (precheck?.error || precheck?.fieldErrors) {
      setError(precheck.error);
      setFieldErrors(precheck.fieldErrors);
      setPending(false);
      return;
    }

    // El sign-in se dispara desde el cliente (no desde una Server Action)
    // para que `SessionProvider` se entere del login sin necesitar un
    // refresh manual — ver el comentario en `loginAction`.
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (!result || result.error) {
      setError("Email o contraseña incorrectos.");
      setPending(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={fieldErrors?.email} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link href="/recuperar-password" className="text-xs font-medium text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
        <FieldError messages={fieldErrors?.password} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Ingresando..." : "Ingresar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-primary hover:underline">
          Creá una acá
        </Link>
      </p>
    </form>
  );
}

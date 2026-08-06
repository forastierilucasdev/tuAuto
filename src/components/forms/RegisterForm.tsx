"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerAction } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/utils";
import { isBusinessAccountType, type AccountTypeValue } from "@/lib/constants";

const ACCOUNT_TYPE_TOGGLE = [
  { value: "PARTICULAR", label: "Vendedor particular" },
  { value: "AGENCIA", label: "Agencia" },
  { value: "CONCESIONARIA", label: "Concesionaria" },
] as const satisfies ReadonlyArray<{ value: AccountTypeValue; label: string }>;

export function RegisterForm() {
  const router = useRouter();
  const [accountType, setAccountType] = React.useState<AccountTypeValue>("PARTICULAR");
  const isBusiness = isBusinessAccountType(accountType);

  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [errors, setErrors] = React.useState<Record<string, string[]>>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setErrors(undefined);

    const formData = new FormData(event.currentTarget);

    const result = await registerAction(undefined, formData);
    if (result?.error || result?.fieldErrors) {
      setError(result.error);
      setErrors(result.fieldErrors);
      setPending(false);
      return;
    }

    // Igual que en LoginForm: el sign-in se dispara desde el cliente para
    // que `SessionProvider` quede sincronizado sin necesitar un refresh
    // manual (ver el comentario en `registerAction`).
    const signInResult = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (!signInResult || signInResult.error) {
      setError("La cuenta se creó, pero no pudimos iniciar sesión automáticamente. Ingresá manualmente.");
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
            <FieldError messages={errors?.businessName} />
          </div>
          <div>
            <Label htmlFor="cuit">CUIT</Label>
            <Input id="cuit" name="cuit" placeholder="30-71234567-1" required />
            <FieldError messages={errors?.cuit} />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="fullName">Apellido y nombre</Label>
        <Input id="fullName" name="fullName" required />
        <FieldError messages={errors?.fullName} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="dni">DNI</Label>
          <Input id="dni" name="dni" placeholder="30111222" required />
          <FieldError messages={errors?.dni} />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" placeholder="+5491122334455" required />
          <FieldError messages={errors?.phone} />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={errors?.email} />
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required />
        <p className="mt-1 text-xs text-muted-foreground">
          Mínimo 8 caracteres, con al menos una letra y un número.
        </p>
        <FieldError messages={errors?.password} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

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

"use client";

import { useActionState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { changePasswordAction } from "@/server/actions/profile.actions";
import type { ProfileActionState } from "@/server/actions/profile.actions";
import { Label } from "@/components/ui/Label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";

const initialState: ProfileActionState = undefined;

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  // Cambiar la contraseña invalida la sesión actual también (ver
  // `updatePassword`/`sessionVersion`) — se cierra acá de forma explícita en
  // vez de dejar que la próxima navegación falle sola sin explicación.
  useEffect(() => {
    if (!state?.success) return;
    const timeout = setTimeout(() => signOut({ callbackUrl: "/login" }), 2500);
    return () => clearTimeout(timeout);
  }, [state?.success]);

  if (state?.success) {
    return (
      <p className="text-sm text-success">
        Tu contraseña se actualizó correctamente. Por seguridad, cerramos tu sesión — te
        redirigimos para que inicies sesión de nuevo...
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-sm space-y-5">
      <div>
        <Label htmlFor="currentPassword">Contraseña actual</Label>
        <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" required />
        <FieldError messages={state?.fieldErrors?.currentPassword} />
      </div>

      <div>
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" required />
        <p className="mt-1 text-xs text-muted-foreground">
          Mínimo 8 caracteres, con al menos una letra y un número.
        </p>
        <FieldError messages={state?.fieldErrors?.newPassword} />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
        <FieldError messages={state?.fieldErrors?.confirmPassword} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}

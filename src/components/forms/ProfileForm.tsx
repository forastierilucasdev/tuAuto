"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Camera, KeyRound } from "lucide-react";
import { updateProfileAction, type ProfileActionState } from "@/server/actions/profile.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { ACCOUNT_TYPE_OPTIONS, isBusinessAccountType, type AccountTypeValue } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";

const initialState: ProfileActionState = undefined;

type ProfileFormProps = {
  accountType: AccountTypeValue;
  email: string;
  dni: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  agency?: {
    businessName: string;
    cuit: string;
    city: string | null;
    province: string | null;
    description: string | null;
  } | null;
  /** Se dispara cuando el guardado fue exitoso (ej. para refrescar el avatar del header). */
  onSaved?: () => void;
};

export function ProfileForm({
  accountType: initialAccountType,
  email,
  dni,
  fullName,
  phone,
  avatarUrl,
  agency,
  onSaved,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [accountType, setAccountType] = React.useState<AccountTypeValue>(initialAccountType);
  const isBusiness = isBusinessAccountType(accountType);

  const [preview, setPreview] = React.useState<string | null>(avatarUrl);
  const [nameForInitials, setNameForInitials] = React.useState(fullName);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (state?.success) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <input type="hidden" name="accountType" value={accountType} />

      <div>
        <Label>Foto de perfil</Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Foto de perfil"
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
                {getInitials(nameForInitials) || "?"}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white">
              <Camera className="h-6 w-6" />
            </span>
          </button>
          <div className="text-xs text-muted-foreground">
            <p>Click en el círculo para cambiar la foto.</p>
            <p>La imagen se centra y recorta automáticamente.</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <div>
        <Label>Email</Label>
        <Input value={email} disabled />
        <p className="mt-1 text-xs text-muted-foreground">
          El email no se puede modificar desde acá. Escribinos a soporte si necesitás corregirlo.
        </p>
      </div>

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

      <div>
        <Label htmlFor="fullName">Apellido y nombre</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={fullName}
          onChange={(e) => setNameForInitials(e.target.value)}
          required
        />
        <FieldError messages={state?.fieldErrors?.fullName} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="dni">DNI</Label>
          <Input id="dni" name="dni" defaultValue={dni} required />
          <FieldError messages={state?.fieldErrors?.dni} />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={phone} required />
          <FieldError messages={state?.fieldErrors?.phone} />
        </div>
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

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Link
          href="/dashboard/perfil/password"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <KeyRound className="h-4 w-4" />
          Cambiar contraseña
        </Link>
      </div>
    </form>
  );
}

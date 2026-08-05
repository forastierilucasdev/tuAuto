"use client";

import * as React from "react";
import { useActionState } from "react";
import { Camera, User as UserIcon } from "lucide-react";
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
  avatarUrl: string | null;
  agency?: {
    businessName: string;
    cuit: string;
    city: string | null;
    province: string | null;
    description: string | null;
  } | null;
};

export function ProfileForm({
  accountType,
  email,
  dni,
  fullName,
  phone,
  avatarUrl,
  agency,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const isBusiness = isBusinessAccountType(accountType);

  const [preview, setPreview] = React.useState<string | null>(avatarUrl);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div>
        <Label>Foto de perfil</Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-surface-muted"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Foto de perfil"
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                <UserIcon className="h-10 w-10" />
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

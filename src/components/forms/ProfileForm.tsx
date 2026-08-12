"use client";

import * as React from "react";
import { useActionState } from "react";
import { Camera } from "lucide-react";
import { updateProfileAction, type ProfileActionState } from "@/server/actions/profile.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { getInitials } from "@/lib/utils";
import type { AccountTypeValue } from "@/lib/constants";

const initialState: ProfileActionState = undefined;

type ProfileFormProps = {
  accountType: AccountTypeValue;
  email: string;
  dni: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  // Los datos de negocio (razón social, CUIT, ciudad, etc.) ya no se editan
  // acá — viven en la pantalla "Tipo de cuenta" — pero igual hay que
  // reenviarlos sin cambios en cada guardado, porque `updateProfileAction`
  // los pide completos para las cuentas de negocio.
  agency?: {
    businessName: string;
    cuit: string;
    city: string | null;
    province: string | null;
    description: string | null;
    address: string | null;
    website: string | null;
  } | null;
  /** Se dispara cuando el guardado fue exitoso (ej. para refrescar el avatar del header). */
  onSaved?: () => void;
};

export function ProfileForm({
  accountType,
  email,
  dni,
  fullName,
  phone,
  avatarUrl,
  agency,
  onSaved,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

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
      {agency && (
        <>
          <input type="hidden" name="businessName" value={agency.businessName} />
          <input type="hidden" name="cuit" value={agency.cuit} />
          <input type="hidden" name="city" value={agency.city ?? ""} />
          <input type="hidden" name="province" value={agency.province ?? ""} />
          <input type="hidden" name="description" value={agency.description ?? ""} />
          <input type="hidden" name="address" value={agency.address ?? ""} />
          <input type="hidden" name="website" value={agency.website ?? ""} />
        </>
      )}

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

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Perfil actualizado correctamente.</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

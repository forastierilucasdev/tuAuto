"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Camera, ImagePlus } from "lucide-react";
import { updateProfileAction, type ProfileActionState } from "@/server/actions/profile.actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button, buttonVariants } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { ImagePositionPicker } from "@/components/ui/ImagePositionPicker";
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
    logoUrl: string | null;
    logoPositionX: number;
    logoPositionY: number;
    address: string | null;
    website: string | null;
  } | null;
};

/**
 * Pantalla propia para el tipo de cuenta y, si es Agencia/Concesionaria,
 * todos sus datos de negocio (antes vivían mezclados en "Mi perfil"). Reusa
 * `updateProfileAction` — manda como ocultos nombre/DNI/teléfono, que no se
 * editan acá, para no pisarlos con vacío.
 */
export function AccountTypeForm({ accountType: initialAccountType, fullName, dni, phone, agency }: AccountTypeFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [accountType, setAccountType] = React.useState<AccountTypeValue>(initialAccountType);
  const isBusiness = isBusinessAccountType(accountType);

  const [logoPreview, setLogoPreview] = React.useState<string | null>(agency?.logoUrl ?? null);
  const [logoPositionX, setLogoPositionX] = React.useState(agency?.logoPositionX ?? 50);
  const [logoPositionY, setLogoPositionY] = React.useState(agency?.logoPositionY ?? 50);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      // Una foto nueva empieza centrada — la posición vieja era para la imagen anterior.
      setLogoPositionX(50);
      setLogoPositionY(50);
    }
  }

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
    <form action={formAction} className="max-w-xl space-y-5">
      <input type="hidden" name="fullName" value={fullName} />
      <input type="hidden" name="dni" value={dni} />
      <input type="hidden" name="phone" value={phone} />

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

          <div className="space-y-5 rounded-2xl border border-border bg-surface-muted/40 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Datos comerciales</p>
              <p className="text-xs text-muted-foreground">
                Se muestran en tu página pública de {accountType === "CONCESIONARIA" ? "concesionaria" : "agencia"}.
              </p>
            </div>

            <div>
              <Label>Foto de portada</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-32 shrink-0">
                  <ImagePositionPicker
                    src={logoPreview}
                    x={logoPositionX}
                    y={logoPositionY}
                    onChange={(x, y) => {
                      setLogoPositionX(x);
                      setLogoPositionY(y);
                    }}
                    shape="rounded"
                    className="h-20 w-32"
                    alt="Foto de portada"
                    placeholder={
                      <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImagePlus className="h-6 w-6" />
                      </span>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    aria-label="Cambiar foto de portada"
                    className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-card hover:bg-surface-muted"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se muestra en la tarjeta y en el encabezado de tu página pública. Arrastrá la imagen para
                  centrarla a tu gusto.
                </p>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                name="logo"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={handleLogoChange}
              />
              <input type="hidden" name="logoPositionX" value={logoPositionX} />
              <input type="hidden" name="logoPositionY" value={logoPositionY} />
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={agency?.address ?? ""} />
            </div>
            <div>
              <Label htmlFor="website">Sitio web</Label>
              <Input id="website" name="website" placeholder="https://" defaultValue={agency?.website ?? ""} />
            </div>
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

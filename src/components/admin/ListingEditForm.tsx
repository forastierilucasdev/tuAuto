"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { adminUpdateListingAction, type AdminActionState } from "@/server/actions/admin/listings.actions";

const initialState: AdminActionState = undefined;

export function ListingEditForm({
  listingId,
  disabled,
  listing,
  versions,
  currentVersionSlug,
}: {
  listingId: string;
  disabled: boolean;
  versions: { slug: string; name: string }[];
  currentVersionSlug: string | null;
  listing: {
    version: string | null;
    condition: string;
    transmission: string | null;
    description: string | null;
    price: unknown;
    currency: string;
    priceNegotiable: boolean;
    acceptsTrade: boolean;
    acceptsFinancing: boolean;
    mileageKm: number | null;
    city: string | null;
    province: string | null;
    contactAddress: string | null;
  };
}) {
  const action = adminUpdateListingAction.bind(null, listingId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">Precio</Label>
          <Input id="price" name="price" type="number" step="0.01" defaultValue={String(listing.price)} disabled={disabled} required />
        </div>
        <div>
          <Label htmlFor="currency">Moneda</Label>
          <Select id="currency" name="currency" defaultValue={listing.currency} disabled={disabled}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="condition">Condición</Label>
          <Select id="condition" name="condition" defaultValue={listing.condition} disabled={disabled}>
            <option value="NUEVO">Nuevo</option>
            <option value="USADO">Usado</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="mileageKm">Kilometraje</Label>
          <Input id="mileageKm" name="mileageKm" type="number" defaultValue={listing.mileageKm ?? ""} disabled={disabled} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="province">Provincia</Label>
          <Input id="province" name="province" defaultValue={listing.province ?? ""} disabled={disabled} />
        </div>
        <div>
          <Label htmlFor="city">Localidad</Label>
          <Input id="city" name="city" defaultValue={listing.city ?? ""} disabled={disabled} />
        </div>
      </div>

      <div>
        <Label htmlFor="versionSlug">Versión</Label>
        <Select id="versionSlug" name="versionSlug" defaultValue={currentVersionSlug ?? ""} disabled={disabled}>
          <option value="">Sin versión especificada</option>
          {versions.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.name}
            </option>
          ))}
          {currentVersionSlug && !versions.some((v) => v.slug === currentVersionSlug) && (
            <option value={currentVersionSlug}>{listing.version ?? currentVersionSlug}</option>
          )}
        </Select>
        {!currentVersionSlug && listing.version && (
          <p className="mt-1 text-xs text-muted-foreground">
            Versión actual (texto libre, de antes de este catálogo): &quot;{listing.version}&quot;. Si aparece en la
            lista, elegila para dejarla vinculada.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="contactAddress">Dirección de contacto</Label>
        <Input id="contactAddress" name="contactAddress" defaultValue={listing.contactAddress ?? ""} disabled={disabled} />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={listing.description ?? ""} disabled={disabled} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="priceNegotiable" defaultChecked={listing.priceNegotiable} disabled={disabled} />
          Precio negociable
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="acceptsTrade" defaultChecked={listing.acceptsTrade} disabled={disabled} />
          Acepta permuta
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="acceptsFinancing" defaultChecked={listing.acceptsFinancing} disabled={disabled} />
          Acepta financiamiento
        </label>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Cambios guardados.</p>}

      <Button type="submit" disabled={disabled || pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

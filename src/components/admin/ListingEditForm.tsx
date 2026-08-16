"use client";

import * as React from "react";
import { useActionState } from "react";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SuccessModalBody } from "@/components/ui/SuccessModalBody";
import { adminUpdateListingAction, type AdminActionState } from "@/server/actions/admin/listings.actions";
import { useLocationTaxonomy } from "@/hooks/useLocationTaxonomy";

const initialState: AdminActionState = undefined;

export function ListingEditForm({
  listingId,
  disabled,
  listing,
  versions,
  currentVersionSlug,
  currentProvinceSlug,
  currentLocalitySlug,
}: {
  listingId: string;
  disabled: boolean;
  versions: { slug: string; name: string }[];
  currentVersionSlug: string | null;
  currentProvinceSlug: string | null;
  currentLocalitySlug: string | null;
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
  const [provinceSlug, setProvinceSlug] = React.useState(currentProvinceSlug ?? "");
  const [localitySlug, setLocalitySlug] = React.useState(currentLocalitySlug ?? "");
  const { provinces, localities } = useLocationTaxonomy(provinceSlug);

  // Mismo patrón "ajustar estado durante el render" que `ProfileForm` — el
  // modal de "¡Listo!" vuelve a aparecer en cada guardado exitoso, incluso
  // si dos guardados seguidos son ambos exitosos.
  const [prevState, setPrevState] = React.useState(state);
  const [savedModalDismissed, setSavedModalDismissed] = React.useState(false);
  if (state !== prevState) {
    setPrevState(state);
    setSavedModalDismissed(false);
  }
  const showSavedModal = Boolean(state?.success) && !savedModalDismissed;

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
          <Label htmlFor="provinceSlug">Provincia</Label>
          <Select
            id="provinceSlug"
            name="provinceSlug"
            value={provinceSlug}
            onChange={(e) => {
              setProvinceSlug(e.target.value);
              setLocalitySlug("");
            }}
            disabled={disabled}
          >
            <option value="">Sin provincia especificada</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
            {provinceSlug && !provinces.some((p) => p.slug === provinceSlug) && (
              <option value={provinceSlug}>{listing.province ?? provinceSlug}</option>
            )}
          </Select>
          {!currentProvinceSlug && listing.province && (
            <p className="mt-1 text-xs text-muted-foreground">
              Provincia actual (texto libre, de antes de este catálogo): &quot;{listing.province}&quot;. Si aparece
              en la lista, elegila para dejarla vinculada.
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="localitySlug">Localidad</Label>
          <Select
            id="localitySlug"
            name="localitySlug"
            value={localitySlug}
            onChange={(e) => setLocalitySlug(e.target.value)}
            disabled={disabled || !provinceSlug}
          >
            <option value="">{provinceSlug ? "Sin localidad especificada" : "Elegí primero una provincia"}</option>
            {localities.map((l) => (
              <option key={l.id} value={l.slug}>
                {l.name}
              </option>
            ))}
            {localitySlug && !localities.some((l) => l.slug === localitySlug) && (
              <option value={localitySlug}>{listing.city ?? localitySlug}</option>
            )}
          </Select>
          {!currentLocalitySlug && listing.city && (
            <p className="mt-1 text-xs text-muted-foreground">
              Localidad actual (texto libre, de antes de este catálogo): &quot;{listing.city}&quot;. Si aparece en la
              lista, elegila para dejarla vinculada.
            </p>
          )}
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

      <Button type="submit" disabled={disabled || pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>

      <Modal open={showSavedModal} onClose={() => setSavedModalDismissed(true)} title="¡Listo!">
        <SuccessModalBody message="Cambios guardados." onClose={() => setSavedModalDismissed(true)} />
      </Modal>
    </form>
  );
}

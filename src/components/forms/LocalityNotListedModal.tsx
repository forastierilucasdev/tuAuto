"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { useLocationTaxonomy } from "@/hooks/useLocationTaxonomy";

export type PendingLocality = {
  provinceSlug: string;
  provinceName: string;
  localityName: string;
};

/**
 * Modal "¿No encontrás tu localidad?" del wizard — mismo criterio que
 * `VehicleNotListedModal`: autocontenido, no llama a ningún Server Action,
 * solo junta los datos en memoria (`LocalityRequest` real recién se crea
 * dentro de `createListing`). La Provincia siempre es real (lista fija de
 * 24, ya sembrada) — solo la Localidad puede quedar pendiente.
 */
export function LocalityNotListedModal({ onSave }: { onSave: (data: PendingLocality) => void }) {
  const [open, setOpen] = React.useState(false);
  const [provinceSlug, setProvinceSlug] = React.useState("");
  const [localityName, setLocalityName] = React.useState("");
  const [error, setError] = React.useState<string>();
  const { provinces } = useLocationTaxonomy("");

  function openModal() {
    setProvinceSlug("");
    setLocalityName("");
    setError(undefined);
    setOpen(true);
  }

  function confirm() {
    const province = provinces.find((p) => p.slug === provinceSlug);
    if (!province || !localityName.trim()) {
      setError("Completá todos los campos.");
      return;
    }
    onSave({ provinceSlug: province.slug, provinceName: province.name, localityName: localityName.trim() });
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={openModal} className="text-sm font-medium text-primary hover:underline">
        ¿No encontrás tu localidad? Cargar
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cargar localidad">
        <div className="space-y-3 text-sm">
          <p className="rounded-lg bg-surface-muted p-3 text-xs text-muted-foreground">
            Los datos ingresados serán validados por el administrador, una vez aprobados, la publicación será
            visible en el catálogo del sitio, mientras tanto estará inactiva y no te descontará publicaciones
            disponibles.
          </p>
          <div>
            <Label htmlFor="pending-provinceSlug">Provincia</Label>
            <Select id="pending-provinceSlug" value={provinceSlug} onChange={(e) => setProvinceSlug(e.target.value)}>
              <option value="">Elegí una provincia</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="pending-localityName">Localidad</Label>
            <Input
              id="pending-localityName"
              value={localityName}
              onChange={(e) => setLocalityName(e.target.value)}
              placeholder="Ej: Villa Carlos Paz"
            />
          </div>
          {error && <p className="text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={confirm}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

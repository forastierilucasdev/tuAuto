"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { PENDING_APPROVAL_MESSAGE, VEHICLE_TYPES } from "@/lib/constants";

export type PendingVehicle = {
  vehicleType: string;
  vehicleTypeLabel: string;
  brandName: string;
  modelName: string;
  versionName: string;
  year: string;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR + 1 - i);

/**
 * Modal "¿Tu vehículo no está en la lista?" del wizard — autocontenido (su
 * propio Tipo/Año, no reusa el estado del paso "Datos principales"): al
 * guardar, reemplaza todo ese bloque por un resumen fijo (ver ListingForm).
 * NO llama a ningún Server Action acá — solo junta los datos en memoria; el
 * `TaxonomyRequest` real recién se crea dentro de `createListing` si el
 * usuario efectivamente termina publicando (así no queda una solicitud
 * huérfana si abandona el wizard a mitad de camino).
 */
export function VehicleNotListedModal({ onSave }: { onSave: (data: PendingVehicle) => void }) {
  const [open, setOpen] = React.useState(false);
  const [vehicleType, setVehicleType] = React.useState("");
  const [brandName, setBrandName] = React.useState("");
  const [modelName, setModelName] = React.useState("");
  const [versionName, setVersionName] = React.useState("");
  const [year, setYear] = React.useState("");
  const [error, setError] = React.useState<string>();

  function openModal() {
    setVehicleType("");
    setBrandName("");
    setModelName("");
    setVersionName("");
    setYear("");
    setError(undefined);
    setOpen(true);
  }

  function confirm() {
    const type = VEHICLE_TYPES.find((t) => t.value === vehicleType);
    if (!type || !brandName.trim() || !modelName.trim() || !versionName.trim() || !year) {
      setError("Completá todos los campos.");
      return;
    }
    onSave({
      vehicleType: type.value,
      vehicleTypeLabel: type.label,
      brandName: brandName.trim(),
      modelName: modelName.trim(),
      versionName: versionName.trim(),
      year,
    });
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={openModal} className="text-sm font-medium text-primary hover:underline">
        ¿Tu vehículo no está en la lista? Cargar
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cargar vehículo">
        <div className="space-y-3 text-sm">
          <p className="rounded-lg bg-surface-muted p-3 text-xs text-muted-foreground">{PENDING_APPROVAL_MESSAGE}</p>
          <div>
            <Label htmlFor="pending-vehicleType">Tipo de vehículo</Label>
            <Select id="pending-vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              <option value="">Elegí un tipo</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="pending-brandName">Marca</Label>
            <Input id="pending-brandName" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ej: Toyota" />
          </div>
          <div>
            <Label htmlFor="pending-modelName">Modelo</Label>
            <Input id="pending-modelName" value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="Ej: Corolla" />
          </div>
          <div>
            <Label htmlFor="pending-versionName">Versión</Label>
            <Input
              id="pending-versionName"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Ej: XEI 1.8"
            />
          </div>
          <div>
            <Label htmlFor="pending-year">Año</Label>
            <Select id="pending-year" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Elegí un año</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
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

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { createVehicleTypeAction, updateVehicleTypeAction } from "@/server/actions/admin/vehicle-types.actions";
import { ADMIN_SELECTABLE_ICONS } from "@/lib/constants";
import type { VehicleTypeCatalog } from "@/generated/prisma/client";

type Props =
  | { mode: "create"; canEdit: boolean }
  | { mode: "edit"; vehicleType: VehicleTypeCatalog; canEdit: boolean };

const ICON_NAMES = Object.keys(ADMIN_SELECTABLE_ICONS);

/** Alta/edición de un tipo de vehículo — el código (`code`) solo se pide al crear, nunca se edita después (es la clave que la próxima fase usa para resolver `Model`/`Listing.vehicleTypeId`). */
export function VehicleTypeFormModal(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState(isEdit ? props.vehicleType.code : "");
  const [label, setLabel] = React.useState(isEdit ? props.vehicleType.label : "");
  const [labelPlural, setLabelPlural] = React.useState(isEdit ? props.vehicleType.labelPlural : "");
  const [icon, setIcon] = React.useState(isEdit ? props.vehicleType.icon : "Car");
  const [mileageUnit, setMileageUnit] = React.useState<"" | "KM" | "HORAS">(
    isEdit ? ((props.vehicleType.mileageUnit as "KM" | "HORAS" | null) ?? "") : ""
  );
  const [usesTransmission, setUsesTransmission] = React.useState(isEdit ? props.vehicleType.usesTransmission : false);
  const [sortOrder, setSortOrder] = React.useState(isEdit ? String(props.vehicleType.sortOrder) : "0");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  function openModal() {
    if (isEdit) {
      setCode(props.vehicleType.code);
      setLabel(props.vehicleType.label);
      setLabelPlural(props.vehicleType.labelPlural);
      setIcon(props.vehicleType.icon);
      setMileageUnit((props.vehicleType.mileageUnit as "KM" | "HORAS" | null) ?? "");
      setUsesTransmission(props.vehicleType.usesTransmission);
      setSortOrder(String(props.vehicleType.sortOrder));
    } else {
      setCode("");
      setLabel("");
      setLabelPlural("");
      setIcon("Car");
      setMileageUnit("");
      setUsesTransmission(false);
      setSortOrder("0");
    }
    setError(undefined);
    setOpen(true);
  }

  async function confirm() {
    setPending(true);
    setError(undefined);
    const input = {
      code,
      label,
      labelPlural,
      icon,
      mileageUnit: mileageUnit || null,
      usesTransmission,
      sortOrder: Number(sortOrder) || 0,
    };
    const result = isEdit ? await updateVehicleTypeAction(props.vehicleType.id, input) : await createVehicleTypeAction(input);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant={isEdit ? "outline" : "primary"} size="sm" disabled={!props.canEdit} onClick={openModal}>
        {isEdit ? "Editar" : "Nuevo tipo de vehículo"}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? `Editar tipo — ${props.vehicleType.code}` : "Nuevo tipo de vehículo"}
      >
        <div className="space-y-3 text-sm">
          {!isEdit && (
            <div>
              <Label htmlFor="vt-code">Código (interno, sin espacios)</Label>
              <Input id="vt-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ej: CAMION" />
            </div>
          )}
          <div>
            <Label htmlFor="vt-label">Nombre (singular)</Label>
            <Input id="vt-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej: Camión" />
          </div>
          <div>
            <Label htmlFor="vt-labelPlural">Nombre (plural)</Label>
            <Input id="vt-labelPlural" value={labelPlural} onChange={(e) => setLabelPlural(e.target.value)} placeholder="Ej: Camiones" />
          </div>
          <div>
            <Label htmlFor="vt-icon">Ícono</Label>
            <Select id="vt-icon" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {ICON_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="vt-mileageUnit">Unidad de uso</Label>
            <Select id="vt-mileageUnit" value={mileageUnit} onChange={(e) => setMileageUnit(e.target.value as typeof mileageUnit)}>
              <option value="">Ninguna (ej: moto, bici)</option>
              <option value="KM">Kilómetros</option>
              <option value="HORAS">Horas de uso</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={usesTransmission} onChange={(e) => setUsesTransmission(e.target.checked)} />
            Usa transmisión (mecánica/asistida)
          </label>
          <div>
            <Label htmlFor="vt-sortOrder">Orden (menor = aparece primero)</Label>
            <Input id="vt-sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          {error && <p className="text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" size="sm" disabled={pending} onClick={confirm}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

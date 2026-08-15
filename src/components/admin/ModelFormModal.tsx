"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { createModelAction, updateModelAction } from "@/server/actions/admin/vehicles.actions";
import type { Model } from "@/generated/prisma/client";

type BrandOption = { id: string; name: string };
type VehicleTypeOption = { id: string; label: string };

type Props =
  | { mode: "create"; canEdit: boolean; brands: BrandOption[]; vehicleTypes: VehicleTypeOption[] }
  | { mode: "edit"; model: Model; canEdit: boolean; brands: BrandOption[]; vehicleTypes: VehicleTypeOption[] };

export function ModelFormModal(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(isEdit ? props.model.name : "");
  const [brandId, setBrandId] = React.useState(isEdit ? props.model.brandId : (props.brands[0]?.id ?? ""));
  const [vehicleTypeId, setVehicleTypeId] = React.useState(
    isEdit ? props.model.vehicleTypeId : (props.vehicleTypes[0]?.id ?? "")
  );
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  function openModal() {
    if (isEdit) {
      setName(props.model.name);
      setBrandId(props.model.brandId);
      setVehicleTypeId(props.model.vehicleTypeId);
    } else {
      setName("");
      setBrandId(props.brands[0]?.id ?? "");
      setVehicleTypeId(props.vehicleTypes[0]?.id ?? "");
    }
    setError(undefined);
    setOpen(true);
  }

  async function confirm() {
    setPending(true);
    setError(undefined);
    const input = { name, brandId, vehicleTypeId };
    const result = isEdit ? await updateModelAction(props.model.id, input) : await createModelAction(input);
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
        {isEdit ? "Editar" : "Nuevo modelo"}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? `Editar modelo — ${props.model.name}` : "Nuevo modelo"}>
        <div className="space-y-3 text-sm">
          <div>
            <Label htmlFor="model-brand">Marca</Label>
            <Select id="model-brand" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              {props.brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="model-vehicleType">Tipo de vehículo</Label>
            <Select id="model-vehicleType" value={vehicleTypeId} onChange={(e) => setVehicleTypeId(e.target.value)}>
              {props.vehicleTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="model-name">Nombre</Label>
            <Input id="model-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Corolla" />
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

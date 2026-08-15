"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { createVersionAction, updateVersionAction } from "@/server/actions/admin/vehicles.actions";
import type { Version } from "@/generated/prisma/client";

type ModelOption = { id: string; name: string; brandId: string };
type BrandOption = { id: string; name: string };

type Props =
  | { mode: "create"; canEdit: boolean; brands: BrandOption[]; models: ModelOption[] }
  | { mode: "edit"; version: Version; canEdit: boolean; brands: BrandOption[]; models: ModelOption[] };

/** El modelo se elige en cascada (Marca → Modelo) para no tener que buscar entre ~60 modelos sueltos. */
export function VersionFormModal(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const editingModel = isEdit ? props.models.find((m) => m.id === props.version.modelId) : undefined;

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(isEdit ? props.version.name : "");
  const [brandId, setBrandId] = React.useState(editingModel?.brandId ?? props.brands[0]?.id ?? "");
  const modelsForBrand = props.models.filter((m) => m.brandId === brandId);
  const [modelId, setModelId] = React.useState(isEdit ? props.version.modelId : (modelsForBrand[0]?.id ?? ""));
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  function openModal() {
    const initialBrandId = editingModel?.brandId ?? props.brands[0]?.id ?? "";
    setName(isEdit ? props.version.name : "");
    setBrandId(initialBrandId);
    setModelId(isEdit ? props.version.modelId : (props.models.find((m) => m.brandId === initialBrandId)?.id ?? ""));
    setError(undefined);
    setOpen(true);
  }

  function handleBrandChange(nextBrandId: string) {
    setBrandId(nextBrandId);
    setModelId(props.models.find((m) => m.brandId === nextBrandId)?.id ?? "");
  }

  async function confirm() {
    setPending(true);
    setError(undefined);
    const input = { name, modelId };
    const result = isEdit ? await updateVersionAction(props.version.id, input) : await createVersionAction(input);
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
        {isEdit ? "Editar" : "Nueva versión"}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? `Editar versión — ${props.version.name}` : "Nueva versión"}>
        <div className="space-y-3 text-sm">
          <div>
            <Label htmlFor="version-brand">Marca</Label>
            <Select id="version-brand" value={brandId} onChange={(e) => handleBrandChange(e.target.value)}>
              {props.brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="version-model">Modelo</Label>
            <Select id="version-model" value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={modelsForBrand.length === 0}>
              {modelsForBrand.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="version-name">Nombre</Label>
            <Input id="version-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: XEI CVT" />
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

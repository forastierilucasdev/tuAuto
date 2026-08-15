"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { createProvinceAction, updateProvinceAction } from "@/server/actions/admin/locations.actions";
import type { Province } from "@/generated/prisma/client";

type Props = { mode: "create"; canEdit: boolean } | { mode: "edit"; province: Province; canEdit: boolean };

/** El `slug` nunca se pide acá — se deriva del nombre, igual que `BrandFormModal`. */
export function ProvinceFormModal(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(isEdit ? props.province.name : "");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  function openModal() {
    setName(isEdit ? props.province.name : "");
    setError(undefined);
    setOpen(true);
  }

  async function confirm() {
    setPending(true);
    setError(undefined);
    const result = isEdit ? await updateProvinceAction(props.province.id, { name }) : await createProvinceAction({ name });
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
        {isEdit ? "Editar" : "Nueva provincia"}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? `Editar provincia — ${props.province.name}` : "Nueva provincia"}>
        <div className="space-y-3 text-sm">
          <div>
            <Label htmlFor="province-name">Nombre</Label>
            <Input id="province-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mendoza" />
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

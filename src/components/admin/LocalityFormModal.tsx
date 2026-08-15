"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { createLocalityAction, updateLocalityAction } from "@/server/actions/admin/locations.actions";
import type { Locality } from "@/generated/prisma/client";

type Props =
  | { mode: "create"; provinceId: string; canEdit: boolean }
  | { mode: "edit"; locality: Locality; canEdit: boolean };

export function LocalityFormModal(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(isEdit ? props.locality.name : "");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  function openModal() {
    setName(isEdit ? props.locality.name : "");
    setError(undefined);
    setOpen(true);
  }

  async function confirm() {
    setPending(true);
    setError(undefined);
    const result = isEdit
      ? await updateLocalityAction(props.locality.id, { name })
      : await createLocalityAction({ name, provinceId: props.provinceId });
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
        {isEdit ? "Editar" : "Nueva localidad"}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? `Editar localidad — ${props.locality.name}` : "Nueva localidad"}>
        <div className="space-y-3 text-sm">
          <div>
            <Label htmlFor="locality-name">Nombre</Label>
            <Input id="locality-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mar del Plata" />
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

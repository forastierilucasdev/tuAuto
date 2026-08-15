"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { createBrandAction, updateBrandAction } from "@/server/actions/admin/vehicles.actions";
import type { Brand } from "@/generated/prisma/client";

type Props = { mode: "create"; canEdit: boolean } | { mode: "edit"; brand: Brand; canEdit: boolean };

/** El `slug` nunca se pide acá — se deriva del nombre y no se edita después (lo usan las URLs del catálogo). */
export function BrandFormModal(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(isEdit ? props.brand.name : "");
  const [logoUrl, setLogoUrl] = React.useState(isEdit ? (props.brand.logoUrl ?? "") : "");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  function openModal() {
    if (isEdit) {
      setName(props.brand.name);
      setLogoUrl(props.brand.logoUrl ?? "");
    } else {
      setName("");
      setLogoUrl("");
    }
    setError(undefined);
    setOpen(true);
  }

  async function confirm() {
    setPending(true);
    setError(undefined);
    const result = isEdit ? await updateBrandAction(props.brand.id, { name, logoUrl }) : await createBrandAction({ name, logoUrl });
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
        {isEdit ? "Editar" : "Nueva marca"}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? `Editar marca — ${props.brand.name}` : "Nueva marca"}>
        <div className="space-y-3 text-sm">
          <div>
            <Label htmlFor="brand-name">Nombre</Label>
            <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Toyota" />
          </div>
          <div>
            <Label htmlFor="brand-logo">URL del logo (opcional)</Label>
            <Input id="brand-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
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

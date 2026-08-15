"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { createLocalitiesBulkAction } from "@/server/actions/admin/locations.actions";

/** Alta masiva: una localidad por línea — sin parser de CSV en el proyecto, textarea es la opción de menor esfuerzo. */
export function LocalityBulkImportModal({ provinceId, canEdit }: { provinceId: string; canEdit: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [result, setResult] = React.useState<{ created: number; skipped: number }>();

  function openModal() {
    setText("");
    setError(undefined);
    setResult(undefined);
    setOpen(true);
  }

  async function confirm() {
    setPending(true);
    setError(undefined);
    const response = await createLocalitiesBulkAction(provinceId, text);
    setPending(false);
    if (response?.error) {
      setError(response.error);
      return;
    }
    setResult({ created: response?.created ?? 0, skipped: response?.skipped ?? 0 });
    setText("");
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={!canEdit} onClick={openModal}>
        Importar en lote
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Importar localidades en lote">
        <div className="space-y-3 text-sm">
          <div>
            <Label htmlFor="locality-bulk">Una localidad por línea</Label>
            <Textarea
              id="locality-bulk"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Mar del Plata\nBahía Blanca\nTandil"}
            />
          </div>
          {error && <p className="text-danger">{error}</p>}
          {result && (
            <p className="text-success">
              {result.created} localidad{result.created === 1 ? "" : "es"} creada{result.created === 1 ? "" : "s"}
              {result.skipped > 0 ? ` · ${result.skipped} ya existían y se omitieron` : ""}.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Cerrar
            </Button>
            <Button type="button" size="sm" disabled={pending || !text.trim()} onClick={confirm}>
              {pending ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

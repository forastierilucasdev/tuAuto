"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { approveTaxonomyRequestAction, addTaxonomyRequestNoteAction } from "@/server/actions/admin/taxonomy-requests.actions";

export function TaxonomyRequestRowActions({
  requestId,
  brandName,
  modelName,
  versionName,
  existingNote,
  canEdit,
}: {
  requestId: string;
  brandName: string;
  modelName: string;
  versionName: string;
  existingNote: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editedBrand, setEditedBrand] = React.useState(brandName);
  const [editedModel, setEditedModel] = React.useState(modelName);
  const [editedVersion, setEditedVersion] = React.useState(versionName);
  const [approveError, setApproveError] = React.useState<string>();
  const [approving, setApproving] = React.useState(false);

  const [note, setNote] = React.useState(existingNote ?? "");
  const [pendingNote, setPendingNote] = React.useState(false);
  const [noteError, setNoteError] = React.useState<string>();

  function openModal() {
    setEditedBrand(brandName);
    setEditedModel(modelName);
    setEditedVersion(versionName);
    setApproveError(undefined);
    setOpen(true);
  }

  async function confirmApprove() {
    setApproving(true);
    setApproveError(undefined);
    const result = await approveTaxonomyRequestAction(requestId, {
      brandName: editedBrand,
      modelName: editedModel,
      versionName: editedVersion,
    });
    setApproving(false);
    if (result?.error) {
      setApproveError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function saveNote() {
    setPendingNote(true);
    setNoteError(undefined);
    const result = await addTaxonomyRequestNoteAction(requestId, note);
    setPendingNote(false);
    if (result?.error) {
      setNoteError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="success" size="sm" disabled={!canEdit} onClick={openModal}>
        Aprobar
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Aprobar vehículo pendiente">
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Confirmá (o corregí) el nombre final antes de crear las filas reales del catálogo. Esto no publica las
            publicaciones vinculadas — cada una todavía necesita su propia &quot;Validar datos&quot;.
          </p>
          <div>
            <Label htmlFor="approve-brandName">Marca</Label>
            <Input id="approve-brandName" value={editedBrand} onChange={(e) => setEditedBrand(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="approve-modelName">Modelo</Label>
            <Input id="approve-modelName" value={editedModel} onChange={(e) => setEditedModel(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="approve-versionName">Versión</Label>
            <Input id="approve-versionName" value={editedVersion} onChange={(e) => setEditedVersion(e.target.value)} />
          </div>
          {approveError && <p className="text-danger">{approveError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={approving}>
              Cancelar
            </Button>
            <Button type="button" variant="success" size="sm" disabled={approving} onClick={confirmApprove}>
              {approving ? "Aprobando..." : "Aprobar"}
            </Button>
          </div>
        </div>
      </Modal>

      <div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={!canEdit}
          rows={2}
          placeholder="Observación si hay inconsistencias (queda pendiente, no se rechaza)..."
          className="text-sm"
        />
        <div className="mt-1 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={!canEdit || pendingNote} onClick={saveNote}>
            {pendingNote ? "Guardando..." : "Guardar observación"}
          </Button>
          {noteError && <p className="text-xs text-danger">{noteError}</p>}
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { approveLocalityRequestAction, addLocalityRequestNoteAction } from "@/server/actions/admin/locality-requests.actions";

export function LocalityRequestRowActions({
  requestId,
  name,
  existingNote,
  canEdit,
}: {
  requestId: string;
  name: string;
  existingNote: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editedName, setEditedName] = React.useState(name);
  const [approveError, setApproveError] = React.useState<string>();
  const [approving, setApproving] = React.useState(false);

  const [note, setNote] = React.useState(existingNote ?? "");
  const [pendingNote, setPendingNote] = React.useState(false);
  const [noteError, setNoteError] = React.useState<string>();

  function openModal() {
    setEditedName(name);
    setApproveError(undefined);
    setOpen(true);
  }

  async function confirmApprove() {
    setApproving(true);
    setApproveError(undefined);
    const result = await approveLocalityRequestAction(requestId, { name: editedName });
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
    const result = await addLocalityRequestNoteAction(requestId, note);
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
      <Modal open={open} onClose={() => setOpen(false)} title="Aprobar localidad pendiente">
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Confirmá (o corregí) el nombre final antes de crear la localidad real. Esto no publica las publicaciones
            vinculadas — cada una todavía necesita su propia &quot;Validar datos&quot;.
          </p>
          <div>
            <Label htmlFor="approve-localityName">Localidad</Label>
            <Input id="approve-localityName" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
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

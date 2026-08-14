"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { approveVerificationAction, addVerificationNoteAction } from "@/server/actions/admin/verifications.actions";

export function VerificationRowActions({
  requestId,
  existingNote,
  canEdit,
}: {
  requestId: string;
  existingNote: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = React.useState(existingNote ?? "");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function saveNote() {
    setPending(true);
    setError(undefined);
    const result = await addVerificationNoteAction(requestId, note);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <AdminConfirmButton
          label="Aprobar"
          variant="success"
          disabled={!canEdit}
          confirmMessage="El usuario pasa a mostrar la insignia 'Vendedor verificado' en sus publicaciones."
          onConfirm={() => approveVerificationAction(requestId)}
          onSuccess={() => router.refresh()}
        />
      </div>
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
          <Button type="button" variant="outline" size="sm" disabled={!canEdit || pending} onClick={saveNote}>
            {pending ? "Guardando..." : "Guardar observación"}
          </Button>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}

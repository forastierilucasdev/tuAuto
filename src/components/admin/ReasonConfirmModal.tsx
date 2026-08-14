"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

type ActionResult = { error?: string; success?: boolean } | undefined;

/**
 * Botón + modal de confirmación con motivo obligatorio (sin días) — variante
 * de `AdminConfirmButton`/`SuspendActionModal` para acciones que necesitan
 * dejar por qué se hicieron en el registro de auditoría, pero no una
 * cantidad de días (p. ej. "Quitar destacado antes de tiempo").
 */
export function ReasonConfirmModal({
  label,
  confirmLabel,
  description,
  variant = "destructive",
  disabled,
  onConfirm,
  onSuccess,
}: {
  label: string;
  confirmLabel?: string;
  description: string;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  onConfirm: (reason: string) => Promise<ActionResult>;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function confirm() {
    if (reason.trim().length < 3) {
      setError("Contanos el motivo.");
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await onConfirm(reason.trim());
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setReason("");
    onSuccess?.();
  }

  return (
    <>
      <Button type="button" variant={variant} size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{description}</p>
          <div>
            <Label htmlFor="reason-confirm-motivo">Motivo</Label>
            <Textarea
              id="reason-confirm-motivo"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contanos por qué..."
            />
          </div>
          {error && <p className="text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" variant={variant} size="sm" disabled={pending} onClick={confirm}>
              {pending ? "Guardando..." : (confirmLabel ?? label)}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

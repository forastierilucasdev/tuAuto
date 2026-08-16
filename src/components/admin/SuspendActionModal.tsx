"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { SuccessModalBody } from "@/components/ui/SuccessModalBody";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

type ActionResult = { error?: string; success?: boolean } | undefined;

/**
 * Botón + modal "Suspender por días" (input de días + motivo), reusado
 * tanto para cuentas (`UserAccountActions`) como para publicaciones
 * (`ListingStatusActions`) — misma forma en los dos casos, `onConfirm`
 * recibe los valores ya validados en el cliente (días > 0, motivo no
 * vacío) y hace la llamada a la Server Action correspondiente.
 *
 * Mismo criterio que `AdminConfirmButton`: al confirmar con éxito, el modal
 * pasa a una pantalla de "¡Listo!" con tilde en vez de cerrarse solo.
 */
export function SuspendActionModal({
  label,
  entityLabel,
  disabled,
  onConfirm,
  onSuccess,
}: {
  label: string;
  entityLabel: string;
  disabled?: boolean;
  onConfirm: (days: number, reason: string) => Promise<ActionResult>;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [succeeded, setSucceeded] = React.useState(false);
  const [days, setDays] = React.useState(7);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function confirm() {
    if (!Number.isInteger(days) || days <= 0) {
      setError("Ingresá una cantidad de días válida.");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Contanos el motivo de la suspensión.");
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await onConfirm(days, reason.trim());
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setReason("");
    setSucceeded(true);
  }

  function close() {
    setOpen(false);
    if (succeeded) onSuccess?.();
    setTimeout(() => setSucceeded(false), 200);
  }

  return (
    <>
      <Button type="button" variant="destructive" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={close} title={succeeded ? "¡Listo!" : label}>
        {succeeded ? (
          <SuccessModalBody message={`${entityLabel} quedó suspendida.`} onClose={close} />
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {entityLabel} queda suspendida por la cantidad de días que elijas — se reactiva sola al pasar ese
              plazo, o la podés reactivar vos antes desde acá.
            </p>
            <div>
              <Label htmlFor="suspend-days">Días</Label>
              <Input
                id="suspend-days"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="suspend-reason">Motivo</Label>
              <Textarea
                id="suspend-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contanos por qué se suspende..."
              />
            </div>
            {error && <p className="text-danger">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={close} disabled={pending}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={confirm}>
                {pending ? "Guardando..." : "Suspender"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

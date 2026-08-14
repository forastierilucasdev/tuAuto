"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, type ButtonProps } from "@/components/ui/Button";

type ActionResult = { error?: string; success?: boolean } | undefined;

/**
 * Botón + modal de confirmación reutilizado por todas las acciones
 * destructivas/sensibles del panel admin (banear, borrar lógicamente,
 * cancelar suscripción, etc.) — ninguna se ejecuta sin un "Confirmar"
 * explícito, por spec. `onConfirm` es la Server Action ya importada por el
 * componente cliente que renderiza esto (no se pasa como prop desde un
 * Server Component — mismo patrón ya usado en `DestacarPorDiasCarrito`).
 */
export function AdminConfirmButton({
  label,
  confirmLabel,
  confirmMessage,
  variant = "outline",
  disabled,
  onConfirm,
  onSuccess,
}: {
  label: string;
  confirmLabel?: string;
  confirmMessage: string;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  onConfirm: () => Promise<ActionResult>;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function confirm() {
    setPending(true);
    setError(undefined);
    const result = await onConfirm();
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    onSuccess?.();
  }

  return (
    <>
      <Button type="button" variant={variant} size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        <p className="text-sm text-foreground">{confirmMessage}</p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" variant={variant} size="sm" disabled={pending} onClick={confirm}>
            {pending ? "Procesando..." : (confirmLabel ?? label)}
          </Button>
        </div>
      </Modal>
    </>
  );
}

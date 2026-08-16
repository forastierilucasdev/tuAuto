"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { SuccessModalBody } from "@/components/ui/SuccessModalBody";
import { Button, type ButtonProps } from "@/components/ui/Button";

type ActionResult = { error?: string; success?: boolean } | undefined;

/**
 * Botón + modal de confirmación reutilizado por todas las acciones
 * destructivas/sensibles del panel admin (banear, borrar lógicamente,
 * cancelar suscripción, etc.) — ninguna se ejecuta sin un "Confirmar"
 * explícito, por spec. `onConfirm` es la Server Action ya importada por el
 * componente cliente que renderiza esto (no se pasa como prop desde un
 * Server Component — mismo patrón ya usado en `DestacarPorDiasCarrito`).
 *
 * Al confirmar con éxito, el mismo modal cambia a una segunda pantalla con
 * un tilde y un mensaje de "listo" (con cruz para cerrar) — así el admin
 * siempre se entera de que la acción se aplicó, en vez de que el modal
 * simplemente se cierre solo. `onSuccess` (normalmente `router.refresh()`)
 * se dispara recién al cerrar esa segunda pantalla, no antes.
 */
export function AdminConfirmButton({
  label,
  confirmLabel,
  confirmMessage,
  successMessage,
  variant = "outline",
  disabled,
  onConfirm,
  onSuccess,
}: {
  label: string;
  confirmLabel?: string;
  confirmMessage: string;
  /** Default: "{label} realizado con éxito." */
  successMessage?: string;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  onConfirm: () => Promise<ActionResult>;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [succeeded, setSucceeded] = React.useState(false);
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
    setSucceeded(true);
  }

  function close() {
    setOpen(false);
    if (succeeded) onSuccess?.();
    // Se resetea después de la animación de cierre, no antes — si no, el
    // usuario vería el modal "saltar" de vuelta a la pantalla de confirmar
    // durante el fade-out.
    setTimeout(() => setSucceeded(false), 200);
  }

  return (
    <>
      <Button type="button" variant={variant} size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={close} title={succeeded ? "¡Listo!" : label}>
        {succeeded ? (
          <SuccessModalBody message={successMessage ?? `${label} realizado con éxito.`} onClose={close} />
        ) : (
          <>
            <p className="text-sm text-foreground">{confirmMessage}</p>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={close} disabled={pending}>
                Cancelar
              </Button>
              <Button type="button" variant={variant} size="sm" disabled={pending} onClick={confirm}>
                {pending ? "Procesando..." : (confirmLabel ?? label)}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

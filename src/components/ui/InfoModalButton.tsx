"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

/**
 * Ícono de información — al tocarlo, abre un modal (con cruz para cerrar)
 * mostrando `message`. Genérico y reutilizable para cualquier aclaración
 * corta que no amerite ocupar espacio fijo en la pantalla (ej. por qué una
 * publicación está "Pendiente de aprobación").
 */
export function InfoModalButton({ title, message, className }: { title: string; message: string; className?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={title}
        className={className ?? "inline-flex text-muted-foreground hover:text-primary"}
      >
        <Info className="h-4 w-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-muted-foreground">{message}</p>
      </Modal>
    </>
  );
}

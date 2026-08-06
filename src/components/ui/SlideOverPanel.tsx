"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

type SlideOverPanelProps = {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: string;
  children: React.ReactNode;
};

/**
 * Panel deslizable genérico (fondo oscuro + hoja lateral con cruz para
 * cerrar), reutilizado por el drawer de filtros del catálogo y por el menú
 * de cuenta. `side` controla desde qué borde entra.
 *
 * Se monta vía Portal directo a `document.body`: si se renderizara como hijo
 * normal de un header con `backdrop-blur` (que crea su propio "containing
 * block" para elementos `fixed`), el panel quedaba encerrado dentro de la
 * altura del header en vez de ocupar toda la pantalla.
 */
const emptySubscribe = () => () => {};

export function SlideOverPanel({ open, onClose, side = "right", title, children }: SlideOverPanelProps) {
  useBodyScrollLock(open);

  // Portales solo existen en el cliente. `useSyncExternalStore` (en vez de
  // un useState+useEffect) evita el mismatch de hidratación sin disparar un
  // setState dentro de un efecto.
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) return null;

  return createPortal(
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed inset-y-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-background p-4 shadow-xl transition-transform duration-300 ease-out",
          side === "left" ? "left-0" : "right-0",
          open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {title ? <p className="text-base font-semibold text-navy">{title}</p> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </>,
    document.body
  );
}

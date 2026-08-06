"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

/**
 * Modal centrado genérico (fondo oscuro + cruz para cerrar), para
 * confirmaciones cortas. Mismo mecanismo de Portal que `SlideOverPanel` —
 * se monta directo en `document.body` para no quedar atrapado dentro de un
 * ancestro con `backdrop-blur` (ver esa nota en SlideOverPanel.tsx).
 */
const emptySubscribe = () => () => {};

export function Modal({ open, onClose, title, children }: ModalProps) {
  useBodyScrollLock(open);

  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-2xl bg-surface p-5 shadow-card-hover"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-base font-bold text-navy">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-surface-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

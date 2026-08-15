"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type ImagePositionPickerProps = {
  /** `null` muestra `placeholder` en su lugar (todavía no hay imagen cargada). */
  src: string | null;
  /** `object-position`, 0-100. */
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
  shape?: "circle" | "rounded";
  className?: string;
  alt?: string;
  placeholder?: React.ReactNode;
};

/**
 * Arrastrar-para-centrar: la imagen siempre se muestra con `object-fit: cover`
 * (nunca deja espacios vacíos, cualquier posición 0-100 queda cubierta), y
 * arrastrar mueve el punto de anclaje (`object-position`) — mismo patrón que
 * el selector de foto de perfil de la mayoría de redes sociales, sin recorte
 * de tamaño (zoom), solo reposicionamiento.
 */
export function ImagePositionPicker({
  src,
  x,
  y,
  onChange,
  shape = "circle",
  className,
  alt = "",
  placeholder,
}: ImagePositionPickerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragStart = React.useRef<{ clientX: number; clientY: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!src) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { clientX: event.clientX, clientY: event.clientY, x, y };
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((event.clientX - dragStart.current.clientX) / rect.width) * 100;
    const deltaYPercent = ((event.clientY - dragStart.current.clientY) / rect.height) * 100;
    // Arrastrar la imagen (no la ventana): mover el cursor a la derecha
    // corre la foto a la derecha, revelando más de su lado izquierdo.
    onChange(
      clamp(dragStart.current.x - deltaXPercent, 0, 100),
      clamp(dragStart.current.y - deltaYPercent, 0, 100)
    );
  }

  function endDrag() {
    dragStart.current = null;
    setDragging(false);
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative touch-none overflow-hidden border border-border bg-surface-muted select-none",
        shape === "circle" ? "rounded-full" : "rounded-xl",
        src && "cursor-move",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={cn("h-full w-full object-cover", !dragging && "transition-[object-position] duration-100")}
          style={{ objectPosition: `${x}% ${y}%` }}
        />
      ) : (
        placeholder
      )}
    </div>
  );
}

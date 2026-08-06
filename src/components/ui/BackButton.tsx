"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Botón "Volver" reutilizable — navega a la pantalla anterior del historial. */
export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground ${className ?? ""}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Volver
    </button>
  );
}

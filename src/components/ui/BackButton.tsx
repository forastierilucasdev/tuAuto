import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Botón "Volver" reutilizable — SIEMPRE a una ruta fija (`href`), nunca
 * `router.back()`. El historial del navegador puede tener saltos que no
 * coinciden con la jerarquía real de la app (ej. entraste a una pantalla
 * hija desde un link externo, o pasaste por una pantalla intermedia) —
 * con `router.back()` eso generaba loops (going ida y vuelta entre dos
 * pantallas sin nunca salir). Con un `href` fijo por pantalla, tocar
 * "Volver" repetidas veces siempre termina en Inicio.
 */
export function BackButton({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground ${className ?? ""}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Volver
    </Link>
  );
}

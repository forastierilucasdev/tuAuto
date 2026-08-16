import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Contenido compartido de la pantalla "¡Listo!" que reemplaza al contenido
 * normal de un `Modal` cuando una acción termina con éxito (tilde + mensaje
 * + botón "Cerrar", además de la cruz que ya trae `Modal` en su header).
 * Se usa en `AdminConfirmButton`/`ReasonConfirmModal`/`SuspendActionModal`
 * (acciones de estado) y en los modales de alta/edición del catálogo
 * (Marca, Modelo, Versión, Tipo de vehículo, Provincia, Localidad,
 * aprobación de solicitudes pendientes) — nunca se duplica este bloque a
 * mano en un componente nuevo, se importa este.
 */
export function SuccessModalBody({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <CheckCircle2 className="h-12 w-12 text-success" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      <Button type="button" className="mt-2 w-full" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  );
}

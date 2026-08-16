"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PENDING_APPROVAL_MESSAGE } from "@/lib/constants";
import type { ListingStatus } from "@/generated/prisma/client";

export function PublishedListingModal({ slug, status }: { slug: string | undefined; status?: ListingStatus }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(Boolean(slug));
  const isPending = status === "PENDIENTE_APROBACION";

  function close() {
    setOpen(false);
    router.replace("/dashboard/publicaciones");
  }

  function view() {
    // Reemplaza la URL actual (con "?published=...") en vez de solo
    // navegar: si no, "Volver" desde el catálogo te trae de nuevo a esta
    // URL y el modal "publicado" se abre otra vez.
    setOpen(false);
    router.replace("/dashboard/publicaciones");
    router.push(`/catalogo/${slug}`);
  }

  if (!slug) return null;

  // Una publicación pendiente de aprobación (Fase 6/7 del catálogo
  // administrable) todavía NO es visible en el catálogo — mostrar el mismo
  // texto de "publicado con éxito" acá confundía al dueño, que después la
  // veía en "Inactivas" sin entender por qué (ver ERRORES.md).
  return (
    <Modal open={open} onClose={close} title={isPending ? "Enviado a revisión" : "¡Listo!"}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        {isPending ? <Clock className="h-12 w-12 text-primary" /> : <CheckCircle2 className="h-12 w-12 text-success" />}
        <p className="text-base font-bold text-navy">
          {isPending ? "Tu publicación quedó pendiente de revisión" : "Tu anuncio fue publicado con éxito"}
        </p>
        <p className="text-sm text-muted-foreground">
          {isPending ? PENDING_APPROVAL_MESSAGE : "Ya está visible en el catálogo."}
        </p>
        <div className="mt-2 flex w-full gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={close}>
            Cerrar
          </Button>
          {!isPending && (
            <Button type="button" className="flex-1" onClick={view}>
              Ver publicación
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

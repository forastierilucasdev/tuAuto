"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function PublishedListingModal({ slug }: { slug: string | undefined }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(Boolean(slug));

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

  return (
    <Modal open={open} onClose={close} title="¡Listo!">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-base font-bold text-navy">Tu anuncio fue publicado con éxito</p>
        <p className="text-sm text-muted-foreground">Ya está visible en el catálogo.</p>
        <div className="mt-2 flex w-full gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={close}>
            Cerrar
          </Button>
          <Button type="button" className="flex-1" onClick={view}>
            Ver publicación
          </Button>
        </div>
      </div>
    </Modal>
  );
}

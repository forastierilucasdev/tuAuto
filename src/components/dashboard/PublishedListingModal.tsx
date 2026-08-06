"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function PublishedListingModal({ slug }: { slug: string | undefined }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(Boolean(slug));

  function close() {
    setOpen(false);
    router.replace("/dashboard/publicaciones");
  }

  if (!slug) return null;

  return (
    <Modal open={open} onClose={close} title="Anuncio publicado">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-sm text-muted-foreground">Tu publicación ya está visible en el catálogo.</p>
        <div className="mt-2 flex w-full gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={close}>
            Cerrar
          </Button>
          <Link href={`/catalogo/${slug}`} className={cn(buttonVariants(), "flex-1")}>
            Ver
          </Link>
        </div>
      </div>
    </Modal>
  );
}

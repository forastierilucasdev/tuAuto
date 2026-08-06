"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn, formatCurrency, formatKm } from "@/lib/utils";
import { deleteListingAction, markListingSoldAction, pauseListingAction } from "@/server/actions/listing.actions";
import type { OwnerListingData } from "@/server/data/listings";

const STATUS_LABEL: Record<OwnerListingData["status"], string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  RESERVADA: "Reservada",
  PAUSADA: "Pausada",
  EXPIRED: "Vencida",
  SOLD: "Vendida",
};

const STATUS_BADGE_VARIANT: Record<OwnerListingData["status"], "success" | "info" | "default" | "danger"> = {
  DRAFT: "default",
  ACTIVE: "success",
  RESERVADA: "info",
  PAUSADA: "default",
  EXPIRED: "danger",
  SOLD: "default",
};

const REACTIVATABLE: OwnerListingData["status"][] = ["RESERVADA", "PAUSADA", "EXPIRED"];
// Solo lo que sigue visible en el catálogo tiene sentido de abrir desde acá.
const PUBLICLY_VISIBLE: OwnerListingData["status"][] = ["ACTIVE", "RESERVADA"];

export function OwnerListingCard({ listing }: { listing: OwnerListingData }) {
  const [pauseOpen, setPauseOpen] = React.useState(false);
  const [reactivateOpen, setReactivateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const clickable = PUBLICLY_VISIBLE.includes(listing.status);
  const showDestacar = listing.status === "ACTIVE" && !listing.featured;
  const showPausar = listing.status === "ACTIVE";
  const showReactivar = REACTIVATABLE.includes(listing.status);

  const media = (
    <div className="relative aspect-4/3 w-full bg-surface-muted">
      <Image src={listing.imageUrl} alt={listing.title} fill sizes="300px" className="object-cover" />
      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
        {listing.featured && <Badge variant="featured">Destacado</Badge>}
        <Badge variant={STATUS_BADGE_VARIANT[listing.status]}>{STATUS_LABEL[listing.status]}</Badge>
      </div>
    </div>
  );

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      {clickable ? <Link href={`/catalogo/${listing.slug}`}>{media}</Link> : media}
      <CardContent className="flex flex-1 flex-col gap-2 pt-4">
        {clickable ? (
          <Link href={`/catalogo/${listing.slug}`} className="truncate font-semibold text-navy hover:underline">
            {listing.title}
          </Link>
        ) : (
          <p className="truncate font-semibold text-navy">{listing.title}</p>
        )}
        <p className="font-bold text-primary">{formatCurrency(listing.price, listing.currency)}</p>
        <p className="text-xs text-muted-foreground">
          {formatKm(listing.mileageKm)} · {listing.year}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Link
            href={`/dashboard/publicaciones/${listing.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Editar
          </Link>

          {listing.status === "ACTIVE" && (
            <form action={markListingSoldAction}>
              <input type="hidden" name="listingId" value={listing.id} />
              <Button type="submit" variant="ghost" size="sm">
                Marcar vendido
              </Button>
            </form>
          )}

          {showPausar && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setPauseOpen(true)}>
              Pausar
            </Button>
          )}

          {showReactivar && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setReactivateOpen(true)}>
              Reactivar
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>

        {showDestacar && (
          <Link
            href={`/dashboard/publicaciones/${listing.id}/destacar`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "mt-1 w-full bg-warning text-white hover:bg-warning/90"
            )}
          >
            <Star className="h-4 w-4" />
            Destacar anuncio
          </Link>
        )}
      </CardContent>

      <Modal open={pauseOpen} onClose={() => setPauseOpen(false)} title="Pausar publicación">
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-border p-3">
            <p className="font-semibold text-foreground">Marcar como reservada</p>
            <p className="mt-1 text-muted-foreground">
              El anuncio se va a seguir mostrando en el catálogo, indicado como reservado. ¿Deseás continuar?
            </p>
            <form action={pauseListingAction} className="mt-2">
              <input type="hidden" name="listingId" value={listing.id} />
              <input type="hidden" name="status" value="RESERVADA" />
              <Button type="submit" size="sm" variant="outline" onClick={() => setPauseOpen(false)}>
                Sí, marcar como reservada
              </Button>
            </form>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-semibold text-foreground">Pausar publicación</p>
            <p className="mt-1 text-muted-foreground">
              El anuncio va a dejar de mostrarse en el catálogo hasta que lo reactives. ¿Deseás continuar?
            </p>
            <form action={pauseListingAction} className="mt-2">
              <input type="hidden" name="listingId" value={listing.id} />
              <input type="hidden" name="status" value="PAUSADA" />
              <Button type="submit" size="sm" variant="outline" onClick={() => setPauseOpen(false)}>
                Sí, pausar
              </Button>
            </form>
          </div>
        </div>
      </Modal>

      <Modal open={reactivateOpen} onClose={() => setReactivateOpen(false)} title="Reactivar publicación">
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            ¿Querés conservar los datos de tu publicación? Vas a poder revisarlos y actualizarlos; al guardar
            los cambios, tu anuncio vuelve a estar activo.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setReactivateOpen(false)}>
              Cancelar
            </Button>
            <Link
              href={`/dashboard/publicaciones/${listing.id}/editar`}
              className={buttonVariants({ size: "sm" })}
            >
              Sí, editar
            </Link>
          </div>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar publicación">
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            ¿Estás seguro que querés eliminar &quot;{listing.title}&quot;? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <form action={deleteListingAction}>
              <input type="hidden" name="listingId" value={listing.id} />
              <Button type="submit" variant="destructive" size="sm">
                Sí, eliminar
              </Button>
            </form>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

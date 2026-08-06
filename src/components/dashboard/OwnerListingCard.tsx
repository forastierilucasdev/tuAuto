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

const REACTIVATABLE: OwnerListingData["status"][] = ["RESERVADA", "PAUSADA", "EXPIRED", "DRAFT"];

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function OwnerListingCard({ listing }: { listing: OwnerListingData }) {
  const [pauseOpen, setPauseOpen] = React.useState(false);
  const [reactivateOpen, setReactivateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  // Lazy initializer: evita llamar a Date.now() directamente en el render
  // (impuro). Se calcula una sola vez, al montar — de sobra para un
  // contador de días.
  const [now] = React.useState(() => Date.now());

  // El dueño puede abrir su propia publicación en cualquier estado (ver
  // `getListingBySlug`, que la muestra sin el filtro de visibilidad pública
  // cuando el visitante es el dueño) — todas las tarjetas son clickeables.
  const isSold = listing.status === "SOLD";
  const isDraft = listing.status === "DRAFT";
  const showDestacar = listing.status === "ACTIVE" && !listing.featured;
  const showPausar = listing.status === "ACTIVE";
  const showReactivar = REACTIVATABLE.includes(listing.status);
  // Vendida solo se puede ver; borrador todavía no pasó por "vendible".
  const showMarkSold = !isSold && !isDraft;
  const showEditDelete = !isSold;

  const daysRemaining = listing.expiresAt
    ? Math.max(0, Math.ceil((new Date(listing.expiresAt).getTime() - now) / 86400000))
    : null;

  const actions: React.ReactNode[] = [];
  if (showEditDelete) {
    actions.push(
      <Link
        key="editar"
        href={`/dashboard/publicaciones/${listing.id}/editar`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
      >
        Editar
      </Link>
    );
  }
  if (showMarkSold) {
    actions.push(
      <form key="vendido" action={markListingSoldAction}>
        <input type="hidden" name="listingId" value={listing.id} />
        <Button type="submit" variant="ghost" size="sm" className="w-full">
          Marcar vendido
        </Button>
      </form>
    );
  }
  if (showPausar) {
    actions.push(
      <Button key="pausar" type="button" variant="ghost" size="sm" className="w-full" onClick={() => setPauseOpen(true)}>
        Pausar
      </Button>
    );
  }
  if (showReactivar) {
    actions.push(
      <Button
        key="reactivar"
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => setReactivateOpen(true)}
      >
        {isDraft ? "Publicar" : "Reactivar"}
      </Button>
    );
  }
  if (showEditDelete) {
    actions.push(
      <Button
        key="eliminar"
        type="button"
        variant="ghost"
        size="sm"
        className="w-full text-danger hover:bg-danger/10"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Eliminar
      </Button>
    );
  }

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
      <Link href={`/catalogo/${listing.slug}`}>{media}</Link>
      <CardContent className="flex flex-1 flex-col gap-2 pt-4">
        <Link href={`/catalogo/${listing.slug}`} className="truncate font-semibold text-navy hover:underline">
          {listing.title}
        </Link>
        <p className="font-bold text-primary">{formatCurrency(listing.price, listing.currency)}</p>
        <p className="text-xs text-muted-foreground">
          {formatKm(listing.mileageKm)} · {listing.year}
        </p>

        {listing.publishedAt && (
          <p className="text-xs text-muted-foreground">
            Publicado el {dateFormatter.format(new Date(listing.publishedAt))}
            {daysRemaining !== null && <> · Vence en {daysRemaining} día{daysRemaining === 1 ? "" : "s"}</>}
          </p>
        )}

        {actions.length > 0 && (
          <div className="mt-auto grid grid-cols-2 gap-2 pt-2">{actions}</div>
        )}

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

      <Modal
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        title={isDraft ? "Publicar borrador" : "Reactivar publicación"}
      >
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {isDraft
              ? "¿Querés publicar este borrador? Vas a poder revisar y completar los datos antes de que se publique."
              : "¿Querés conservar los datos de tu publicación? Vas a poder revisarlos y actualizarlos; al guardar los cambios, tu anuncio vuelve a estar activo."}
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

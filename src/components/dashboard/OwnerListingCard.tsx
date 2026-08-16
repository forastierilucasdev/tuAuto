"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Star, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { FieldError } from "@/components/ui/FieldError";
import { LISTING_STATUS_BADGE_VARIANT, LISTING_STATUS_LABEL, mileageUnitFor } from "@/lib/constants";
import { cn, daysRemaining, formatCurrency, formatKm } from "@/lib/utils";
import {
  deleteListingAction,
  markListingSoldAction,
  pauseListingAction,
  reactivateListingAction,
} from "@/server/actions/listing.actions";
import type { OwnerListingData } from "@/server/data/listings";

const REACTIVATABLE: OwnerListingData["status"][] = ["RESERVADA", "PAUSADA", "EXPIRED", "DRAFT"];

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function OwnerListingCard({ listing }: { listing: OwnerListingData }) {
  const [pauseOpen, setPauseOpen] = React.useState(false);
  const [reactivateOpen, setReactivateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [soldOpen, setSoldOpen] = React.useState(false);
  const [reactivating, setReactivating] = React.useState(false);
  const [reactivateError, setReactivateError] = React.useState<string>();
  const [pausing, setPausing] = React.useState(false);
  const [pauseError, setPauseError] = React.useState<string>();
  const [selling, setSelling] = React.useState(false);
  const [soldError, setSoldError] = React.useState<string>();
  const [soldFieldErrors, setSoldFieldErrors] = React.useState<Record<string, string[]>>();
  // "Publicación pausada" / "reactivada" / "vendida" — confirma la operación
  // sin navegar, así la pantalla se queda en la misma pestaña (si hay varias
  // publicaciones para reactivar, no hace falta volver a entrar a
  // "Inactivas" después de cada una).
  const [confirmMessage, setConfirmMessage] = React.useState<string>();
  // Lazy initializer: evita llamar a Date.now() directamente en el render
  // (impuro). Se calcula una sola vez, al montar — de sobra para un
  // contador de días y para precargar la fecha de venta de hoy.
  const [now] = React.useState(() => Date.now());
  const [todayIso] = React.useState(() => new Date().toISOString().slice(0, 10));

  async function handlePublishNow() {
    setReactivating(true);
    setReactivateError(undefined);
    const result = await reactivateListingAction(listing.id);
    setReactivating(false);
    if (result?.error) {
      setReactivateError(result.error);
      return;
    }
    setReactivateOpen(false);
    setConfirmMessage(isDraft ? "Publicación publicada." : "Publicación reactivada.");
  }

  async function handlePause(status: "RESERVADA" | "PAUSADA") {
    setPausing(true);
    setPauseError(undefined);
    const result = await pauseListingAction(listing.id, status);
    setPausing(false);
    if (result?.error) {
      setPauseError(result.error);
      return;
    }
    setPauseOpen(false);
    setConfirmMessage(status === "RESERVADA" ? "Publicación marcada como reservada." : "Publicación pausada.");
  }

  async function handleMarkSoldSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelling(true);
    setSoldError(undefined);
    setSoldFieldErrors(undefined);
    const formData = new FormData(event.currentTarget);
    const result = await markListingSoldAction(listing.id, formData);
    setSelling(false);
    if (result?.error || result?.fieldErrors) {
      setSoldError(result.error);
      setSoldFieldErrors(result.fieldErrors);
      return;
    }
    setSoldOpen(false);
    setConfirmMessage("Publicación vendida.");
  }

  // El dueño puede abrir su propia publicación en cualquier estado (ver
  // `getListingBySlug`, que la muestra sin el filtro de visibilidad pública
  // cuando el visitante es el dueño) — todas las tarjetas son clickeables.
  const isSold = listing.status === "SOLD";
  const isDraft = listing.status === "DRAFT";
  // Suspendida por un admin: no entra en REACTIVATABLE (el dueño no la
  // puede reactivar sola, solo se levanta sola por tiempo o la reactiva el
  // admin) y se ocultan Editar/Eliminar/Marcar vendido mientras dura, para
  // que no se pueda esquivar la suspensión operando alrededor.
  const isSuspended = listing.status === "SUSPENDIDA";
  const mileageUnit = mileageUnitFor(listing.vehicleType);
  const showDestacar = listing.status === "ACTIVE" && !listing.featured;
  const showPausar = listing.status === "ACTIVE";
  const showReactivar = REACTIVATABLE.includes(listing.status);
  // Vendida solo se puede ver; borrador todavía no pasó por "vendible".
  const showMarkSold = !isSold && !isDraft && !isSuspended;
  const showEditDelete = !isSold && !isSuspended;

  const remainingDays = listing.expiresAt ? daysRemaining(new Date(listing.expiresAt), now) : null;

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
      <Button
        key="vendido"
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setSoldOpen(true)}
      >
        Marcar vendido
      </Button>
    );
  }
  if (showPausar) {
    actions.push(
      <Button
        key="pausar"
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setPauseOpen(true)}
      >
        Pausar
      </Button>
    );
  }
  if (showReactivar) {
    actions.push(
      <Button
        key="reactivar"
        type="button"
        variant="outline"
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
        variant="outline"
        size="sm"
        className="w-full border-danger/50 text-danger hover:border-danger hover:bg-danger/10"
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
        <Badge variant={LISTING_STATUS_BADGE_VARIANT[listing.status]}>{LISTING_STATUS_LABEL[listing.status]}</Badge>
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
          {mileageUnit ? `${formatKm(listing.mileageKm, mileageUnit)} · ` : ""}
          {listing.year}
        </p>

        {isSuspended && listing.suspendedUntil ? (
          <p className="text-xs text-danger">
            Suspendida hasta el {dateFormatter.format(new Date(listing.suspendedUntil))}
            {listing.suspensionReason && <> — Motivo: {listing.suspensionReason}</>}
          </p>
        ) : isSold && listing.soldAt ? (
          <p className="text-xs text-muted-foreground">
            Vendida el {dateFormatter.format(new Date(listing.soldAt))}
            {listing.realSalePrice !== null && (
              <> · {formatCurrency(listing.realSalePrice, listing.currency)}</>
            )}
          </p>
        ) : (
          listing.publishedAt && (
            <p className="text-xs text-muted-foreground">
              Publicado el {dateFormatter.format(new Date(listing.publishedAt))}
              {remainingDays !== null && <> · Vence en {remainingDays} día{remainingDays === 1 ? "" : "s"}</>}
            </p>
          )
        )}

        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {listing.viewCount} vista{listing.viewCount === 1 ? "" : "s"}
        </p>

        {/* ID único de la publicación — para reportar un error en Soporte hay que indicar cuál es. */}
        <p className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground/70">
          <span className="select-all font-mono">ID: {listing.id}</span>
          <Link href={`/dashboard/soporte?listingId=${listing.id}`} className="shrink-0 underline hover:text-primary">
            Reportar error
          </Link>
        </p>

        {actions.length > 0 && (
          <div className="mt-auto grid grid-cols-2 gap-2 pt-2">{actions}</div>
        )}

        {showDestacar && (
          <Link
            href={`/dashboard/compra?destacar=${listing.id}`}
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={pausing}
              onClick={() => handlePause("RESERVADA")}
            >
              {pausing ? "Guardando..." : "Sí, marcar como reservada"}
            </Button>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-semibold text-foreground">Pausar publicación</p>
            <p className="mt-1 text-muted-foreground">
              El anuncio va a dejar de mostrarse en el catálogo hasta que lo reactives. ¿Deseás continuar?
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={pausing}
              onClick={() => handlePause("PAUSADA")}
            >
              {pausing ? "Guardando..." : "Sí, pausar"}
            </Button>
          </div>
          {pauseError && <p className="text-danger">{pauseError}</p>}
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
              ? "¿Querés editar los datos de la publicación antes de publicarla?"
              : "¿Querés editar los datos de la publicación antes de volver a publicarla?"}
          </p>
          {reactivateError && <p className="text-danger">{reactivateError}</p>}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="destructive" size="sm" onClick={() => setReactivateOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="success"
              size="sm"
              disabled={reactivating}
              onClick={handlePublishNow}
            >
              {reactivating ? "Publicando..." : "Publicar"}
            </Button>
            <Link
              href={`/dashboard/publicaciones/${listing.id}/editar`}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              Sí, editar
            </Link>
          </div>
        </div>
      </Modal>

      <Modal open={soldOpen} onClose={() => setSoldOpen(false)} title="Marcar como vendida">
        <form onSubmit={handleMarkSoldSubmit} className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Confirmá que se vendió &quot;{listing.title}&quot;. Los siguientes datos son opcionales, quedan solo
            para tu registro — no se muestran en el catálogo.
          </p>
          <div>
            <Label htmlFor={`soldAt-${listing.id}`}>Fecha de venta</Label>
            <Input id={`soldAt-${listing.id}`} name="soldAt" type="date" defaultValue={todayIso} />
            <FieldError messages={soldFieldErrors?.soldAt} />
          </div>
          <div>
            <Label htmlFor={`buyerInfo-${listing.id}`}>Datos del comprador (opcional)</Label>
            <Input id={`buyerInfo-${listing.id}`} name="buyerInfo" placeholder="Nombre, teléfono..." />
            <FieldError messages={soldFieldErrors?.buyerInfo} />
          </div>
          <div>
            <Label htmlFor={`realSalePrice-${listing.id}`}>Precio real de venta (opcional)</Label>
            <Input
              id={`realSalePrice-${listing.id}`}
              name="realSalePrice"
              inputMode="numeric"
              placeholder="Ej: 15000000"
            />
            <FieldError messages={soldFieldErrors?.realSalePrice} />
          </div>
          <div>
            <Label htmlFor={`saleConditions-${listing.id}`}>Condiciones (opcional)</Label>
            <Textarea
              id={`saleConditions-${listing.id}`}
              name="saleConditions"
              rows={3}
              placeholder="Ej: contado, con permuta..."
            />
            <FieldError messages={soldFieldErrors?.saleConditions} />
          </div>
          {soldError && <p className="text-danger">{soldError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setSoldOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={selling}>
              {selling ? "Guardando..." : "Confirmar venta"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar publicación">
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            ¿Estás seguro que querés eliminar &quot;{listing.title}&quot;? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
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

      <Modal open={Boolean(confirmMessage)} onClose={() => setConfirmMessage(undefined)} title="¡Listo!">
        <div className="space-y-4 text-sm">
          <p className="text-foreground">{confirmMessage}</p>
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => setConfirmMessage(undefined)}>
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

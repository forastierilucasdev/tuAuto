"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { purchaseFeatureComboAction } from "@/server/actions/payment.actions";

type FeaturableListing = { id: string; title: string };

/**
 * Wizard de "Publicación 30 días + 7 días destacado": paso 1 elegir aplicarlo
 * a una publicación existente (paso 2, selector) o guardarlo para la próxima
 * publicación/reactivación (se aplica solo, ver `loadActivationContext`).
 */
export function FeatureComboWizard({ listings }: { listings: FeaturableListing[] }) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"choice" | "pick">("choice");
  const [selectedListingId, setSelectedListingId] = React.useState(listings[0]?.id ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [done, setDone] = React.useState(false);

  function openWizard() {
    setStep("choice");
    setSelectedListingId(listings[0]?.id ?? "");
    setError(undefined);
    setDone(false);
    setOpen(true);
  }

  async function confirmForNext() {
    setSubmitting(true);
    setError(undefined);
    const result = await purchaseFeatureComboAction({ forNextListing: true });
    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  async function confirmForExisting() {
    if (!selectedListingId) return;
    setSubmitting(true);
    setError(undefined);
    const result = await purchaseFeatureComboAction({ listingId: selectedListingId });
    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <>
      <Button type="button" className="w-full" onClick={openWizard}>
        Comprar
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Publicación 30 días + 7 días destacado">
        {done ? (
          <div className="space-y-3 text-sm">
            <p className="text-foreground">¡Listo! Se aplicó correctamente.</p>
            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Aceptar
              </Button>
            </div>
          </div>
        ) : step === "choice" ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">¿Cómo querés usarlo?</p>
            <button
              type="button"
              onClick={() =>
                listings.length > 0
                  ? setStep("pick")
                  : setError("No tenés publicaciones activas sin destacar para elegir.")
              }
              className="block w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary"
            >
              <p className="font-semibold text-foreground">Aplicar a una publicación existente</p>
              <p className="text-xs text-muted-foreground">
                Elegís cuál — renueva 30 días y la destaca 7 días, ya.
              </p>
            </button>
            <button
              type="button"
              onClick={confirmForNext}
              disabled={submitting}
              className="block w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary disabled:opacity-50"
            >
              <p className="font-semibold text-foreground">Aplicar a la próxima publicación</p>
              <p className="text-xs text-muted-foreground">
                Suma 1 publicación disponible + 1 destacado pendiente, para cuando publiques o reactives.
              </p>
            </button>
            {error && <p className="text-danger">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <Label htmlFor="combo-listing">Publicación</Label>
              <Select id="combo-listing" value={selectedListingId} onChange={(e) => setSelectedListingId(e.target.value)}>
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </Select>
            </div>
            {error && <p className="text-danger">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep("choice")}>
                Atrás
              </Button>
              <Button type="button" size="sm" disabled={submitting} onClick={confirmForExisting}>
                {submitting ? "Procesando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

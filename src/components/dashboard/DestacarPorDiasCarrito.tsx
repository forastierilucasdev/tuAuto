"use client";

import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { purchaseFeatureByDaysAction } from "@/server/actions/payment.actions";
import { formatCurrency } from "@/lib/utils";

type FeaturableListing = { id: string; title: string; maxDays: number };
type CartItem = { listingId: string; title: string; days: number };

/**
 * "Destacar publicación por día": elegís una publicación + cantidad de días
 * (1..días que le quedan de vigencia, recortado también server-side en
 * `purchaseFeatureByDays`), "Agregar elemento" la suma a un carrito — podés
 * cargar varias antes de confirmar una sola compra.
 */
export function DestacarPorDiasCarrito({
  listings,
  pricePerDay,
  preselectedListingId,
}: {
  listings: FeaturableListing[];
  pricePerDay: number;
  preselectedListingId?: string;
}) {
  const eligible = React.useMemo(() => listings.filter((l) => l.maxDays > 0), [listings]);
  const initialId =
    preselectedListingId && eligible.some((l) => l.id === preselectedListingId)
      ? preselectedListingId
      : (eligible[0]?.id ?? "");

  const [selectedId, setSelectedId] = React.useState(initialId);
  const [days, setDays] = React.useState(1);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const selected = eligible.find((l) => l.id === selectedId);
  const maxDays = selected?.maxDays ?? 1;
  // Derivado, no estado: si `days` quedó por encima del máximo de la
  // publicación recién elegida, se recorta al mostrarlo — sin useEffect.
  const clampedDays = Math.max(1, Math.min(days, maxDays || 1));

  if (eligible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tenés publicaciones activas disponibles para destacar en este momento.
      </p>
    );
  }

  function addToCart() {
    if (!selected) return;
    setCart((c) => [
      ...c.filter((i) => i.listingId !== selected.id),
      { listingId: selected.id, title: selected.title, days: clampedDays },
    ]);
  }

  function removeFromCart(listingId: string) {
    setCart((c) => c.filter((i) => i.listingId !== listingId));
  }

  // Si la publicación elegida ya está en el carrito, tocar +/- también
  // actualiza esa línea en vivo — si no, el total quedaba desincronizado del
  // contador hasta volver a tocar "Agregar elemento".
  function updateDays(nextDays: number) {
    const clamped = Math.max(1, Math.min(maxDays, nextDays));
    setDays(clamped);
    setCart((c) => c.map((i) => (i.listingId === selectedId ? { ...i, days: clamped } : i)));
  }

  const total = cart.reduce((sum, i) => sum + i.days * pricePerDay, 0);

  async function confirmPurchase() {
    setSubmitting(true);
    setError(undefined);
    const result = await purchaseFeatureByDaysAction(cart.map((i) => ({ listingId: i.listingId, days: i.days })));
    if (result && "error" in result) {
      setSubmitting(false);
      setError(result.error);
      return;
    }
    // La confirmación real la aplica el webhook de Mercado Pago cuando el
    // pago se apruebe — acá solo se redirige al checkout, no queda nada
    // acreditado todavía.
    if (result) window.location.href = result.redirectUrl;
  }

  return (
    <div className="space-y-4 text-sm">
      <div>
        <Label htmlFor="destacar-listing">Publicación</Label>
        <Select id="destacar-listing" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {eligible.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} ({l.maxDays} día{l.maxDays === 1 ? "" : "s"} disp.)
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label className="mb-0">Días</Label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateDays(clampedDays - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-muted"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-semibold">{clampedDays}</span>
          <button
            type="button"
            onClick={() => updateDays(clampedDays + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-muted"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Máx. {maxDays}</p>
        <p className="ml-auto font-semibold text-foreground">{formatCurrency(clampedDays * pricePerDay)}</p>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addToCart}>
        Agregar elemento
      </Button>

      {cart.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border p-3 text-[#010F40]">
          {cart.map((item) => (
            <div key={item.listingId} className="flex items-center justify-between gap-2">
              <p className="truncate">
                {item.title} — {item.days} día{item.days === 1 ? "" : "s"}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-semibold">{formatCurrency(item.days * pricePerDay)}</span>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.listingId)}
                  aria-label={`Quitar ${item.title}`}
                  className="text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-2 font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {error && <p className="text-danger">{error}</p>}

      <Button
        type="button"
        className="w-full text-lg font-bold"
        disabled={cart.length === 0 || submitting}
        onClick={confirmPurchase}
      >
        {submitting ? "Redirigiendo a Mercado Pago..." : cart.length > 0 ? `Confirmar compra — Total ${formatCurrency(total)}` : "Confirmar compra"}
      </Button>
    </div>
  );
}

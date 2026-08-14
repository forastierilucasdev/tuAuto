"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { updatePlanAction } from "@/server/actions/admin/subscriptions.actions";
import type { Plan } from "@/generated/prisma/client";

type EditablePlan = Pick<Plan, "code" | "name" | "description" | "price" | "durationDays" | "quantity">;

/** Editar nombre/descripción/precio/duración/cantidad de un plan — impacta directo en `/dashboard/compra` (sin caché) y en lo que acredita su próxima compra. `code` e `isActive` no se tocan acá (ver `PlanActiveToggle`). */
export function EditPlanModal({ plan, canEdit }: { plan: EditablePlan; canEdit: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(plan.name);
  const [description, setDescription] = React.useState(plan.description ?? "");
  const [price, setPrice] = React.useState(plan.price.toString());
  const [durationDays, setDurationDays] = React.useState(plan.durationDays?.toString() ?? "");
  const [quantity, setQuantity] = React.useState(plan.quantity?.toString() ?? "");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  function openModal() {
    setName(plan.name);
    setDescription(plan.description ?? "");
    setPrice(plan.price.toString());
    setDurationDays(plan.durationDays?.toString() ?? "");
    setQuantity(plan.quantity?.toString() ?? "");
    setError(undefined);
    setOpen(true);
  }

  async function confirm() {
    setPending(true);
    setError(undefined);
    const result = await updatePlanAction(plan.code, {
      name,
      description,
      price: Number(price),
      durationDays: durationDays.trim() ? Number(durationDays) : null,
      quantity: quantity.trim() ? Number(quantity) : null,
    });
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={!canEdit} onClick={openModal}>
        Editar
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Editar plan — ${plan.code}`}>
        <div className="space-y-3 text-sm">
          <div>
            <Label htmlFor="plan-name">Nombre</Label>
            <Input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="plan-description">Descripción (opcional)</Label>
            <Textarea
              id="plan-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="plan-price">Precio (ARS)</Label>
            <Input id="plan-price" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="plan-duration">Duración en días (dejar vacío si no aplica)</Label>
            <Input
              id="plan-duration"
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="plan-quantity">Cantidad de publicaciones/destacados (dejar vacío si no aplica)</Label>
            <Input
              id="plan-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Los cambios se ven de inmediato en Comprar publicación/suscripción, y son los que se acreditan en la
            próxima compra de este plan (las compras ya hechas no se modifican).
          </p>
          {error && <p className="text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" size="sm" disabled={pending} onClick={confirm}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

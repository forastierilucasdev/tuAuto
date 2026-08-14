"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  adjustFeaturedVouchersAction,
  adjustPurchasedPublicationsAction,
  cancelSubscriptionAction,
  grantSubscriptionAction,
} from "@/server/actions/admin/subscriptions.actions";

type AdjustAction = (userId: string, delta: number) => Promise<{ error?: string } | undefined>;

/** Campo "ajuste" + botón Guardar — reemplaza el viejo patrón de +1/-1 al toque: el admin escribe el ajuste que quiere aplicar (positivo suma, negativo resta) y confirma una sola vez. */
function AdjustQuotaField({
  label,
  userId,
  action,
  canEdit,
  onSaved,
}: {
  label: string;
  userId: string;
  action: AdjustAction;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [delta, setDelta] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function save() {
    const parsed = Number(delta);
    if (!delta.trim() || !Number.isInteger(parsed) || parsed === 0) {
      setError("Ingresá un ajuste distinto de cero (ej: 5 o -2).");
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await action(userId, parsed);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDelta("");
    onSaved();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <Label htmlFor={`adjust-${label}`}>{label}</Label>
        <Input
          id={`adjust-${label}`}
          type="number"
          placeholder="ej: 5 o -2"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          disabled={!canEdit}
          className="w-28"
        />
      </div>
      <Button type="button" variant="outline" size="sm" disabled={!canEdit || pending} onClick={save}>
        {pending ? "Guardando..." : "Guardar"}
      </Button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </div>
  );
}

export function UserSubscriptionActions({
  userId,
  hasActiveSubscription,
  plans,
  canEdit,
}: {
  userId: string;
  hasActiveSubscription: boolean;
  plans: { code: string; name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [planCode, setPlanCode] = React.useState(plans[0]?.code ?? "");
  const [grantPending, setGrantPending] = React.useState(false);
  const [grantError, setGrantError] = React.useState<string>();

  async function grant() {
    if (!planCode) return;
    setGrantPending(true);
    setGrantError(undefined);
    const result = await grantSubscriptionAction(userId, planCode);
    setGrantPending(false);
    if (result?.error) {
      setGrantError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-sm font-medium text-foreground">Otorgar / renovar suscripción</p>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay planes de suscripción activos.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={planCode} onChange={(e) => setPlanCode(e.target.value)} disabled={!canEdit} className="max-w-56">
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>{plan.name}</option>
              ))}
            </Select>
            <Button type="button" size="sm" disabled={!canEdit || grantPending} onClick={grant}>
              {grantPending ? "Otorgando..." : "Otorgar / renovar"}
            </Button>
          </div>
        )}
        {grantError && <p className="mt-1 text-xs text-danger">{grantError}</p>}
      </div>

      {hasActiveSubscription && (
        <AdminConfirmButton
          label="Cancelar suscripción"
          variant="destructive"
          disabled={!canEdit}
          confirmMessage="El cupo de la suscripción vigente pasa a 0 de inmediato."
          onConfirm={() => cancelSubscriptionAction(userId)}
          onSuccess={() => router.refresh()}
        />
      )}

      <div className="space-y-3 rounded-lg border border-border p-3">
        <AdjustQuotaField
          label="Publicaciones compradas"
          userId={userId}
          action={adjustPurchasedPublicationsAction}
          canEdit={canEdit}
          onSaved={() => router.refresh()}
        />
        <AdjustQuotaField
          label="Vouchers de destacado"
          userId={userId}
          action={adjustFeaturedVouchersAction}
          canEdit={canEdit}
          onSaved={() => router.refresh()}
        />
      </div>
    </div>
  );
}

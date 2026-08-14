"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  adjustFeaturedVouchersAction,
  adjustPurchasedPublicationsAction,
  cancelSubscriptionAction,
  grantSubscriptionAction,
} from "@/server/actions/admin/subscriptions.actions";

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

  function adjust(action: (userId: string, delta: number) => Promise<{ error?: string } | undefined>, delta: number) {
    return async () => {
      const result = await action(userId, delta);
      if (result?.error) return result;
      router.refresh();
      return { success: true };
    };
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

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">Publicaciones compradas:</span>
          <Button type="button" variant="outline" size="sm" disabled={!canEdit} onClick={() => adjust(adjustPurchasedPublicationsAction, 1)()}>+1</Button>
          <Button type="button" variant="outline" size="sm" disabled={!canEdit} onClick={() => adjust(adjustPurchasedPublicationsAction, -1)()}>-1</Button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">Vouchers de destacado:</span>
          <Button type="button" variant="outline" size="sm" disabled={!canEdit} onClick={() => adjust(adjustFeaturedVouchersAction, 1)()}>+1</Button>
          <Button type="button" variant="outline" size="sm" disabled={!canEdit} onClick={() => adjust(adjustFeaturedVouchersAction, -1)()}>-1</Button>
        </div>
      </div>
    </div>
  );
}

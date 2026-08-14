"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ReasonConfirmModal } from "@/components/admin/ReasonConfirmModal";
import { removeFeaturedEarlyAction, setFeaturedAction } from "@/server/actions/admin/featured.actions";

export function FeaturedRowActions({ listingId, isCurrentlyFeatured, canEdit }: { listingId: string; isCurrentlyFeatured: boolean; canEdit: boolean }) {
  const router = useRouter();
  const [days, setDays] = React.useState(7);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function extend() {
    setPending(true);
    setError(undefined);
    const result = await setFeaturedAction(listingId, days);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-w-40 flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          disabled={!canEdit}
          className="w-16 shrink-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canEdit || pending}
          onClick={extend}
          className="shrink-0 whitespace-nowrap"
        >
          {pending ? "..." : "Agregar días"}
        </Button>
      </div>
      {isCurrentlyFeatured && (
        <ReasonConfirmModal
          label="Quitar destacado"
          confirmLabel="Quitar destacado"
          variant="destructive"
          disabled={!canEdit}
          description="Deja de mostrarse como destacada de inmediato. Contanos el motivo para el registro de auditoría."
          onConfirm={(reason) => removeFeaturedEarlyAction(listingId, reason)}
          onSuccess={() => router.refresh()}
        />
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

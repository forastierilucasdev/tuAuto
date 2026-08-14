"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
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
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="number"
        min={1}
        max={365}
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        disabled={!canEdit}
        className="w-20"
      />
      <Button type="button" variant="outline" size="sm" disabled={!canEdit || pending} onClick={extend}>
        {pending ? "..." : "Destacar por días"}
      </Button>
      {isCurrentlyFeatured && (
        <AdminConfirmButton
          label="Quitar destacado"
          variant="destructive"
          disabled={!canEdit}
          confirmMessage="Deja de mostrarse como destacada de inmediato."
          onConfirm={() => removeFeaturedEarlyAction(listingId)}
          onSuccess={() => router.refresh()}
        />
      )}
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { ReasonConfirmModal } from "@/components/admin/ReasonConfirmModal";
import { adminRestoreListingAction, adminSoftDeleteListingAction } from "@/server/actions/admin/listings.actions";

export function ListingRowActions({ listingId, deletedAt, canDelete }: { listingId: string; deletedAt: Date | null; canDelete: boolean }) {
  const router = useRouter();

  if (deletedAt) {
    return (
      <AdminConfirmButton
        label="Restaurar"
        variant="success"
        disabled={!canDelete}
        confirmMessage="La publicación vuelve a ser visible normalmente."
        onConfirm={() => adminRestoreListingAction(listingId)}
        onSuccess={() => router.refresh()}
      />
    );
  }

  return (
    <ReasonConfirmModal
      label="Dar de baja"
      confirmLabel="Dar de baja"
      variant="destructive"
      disabled={!canDelete}
      description="La publicación deja de verse en el catálogo y en el panel del dueño. Queda guardada, se puede restaurar. Contanos el motivo para el registro de auditoría."
      onConfirm={(reason) => adminSoftDeleteListingAction(listingId, reason)}
      onSuccess={() => router.refresh()}
    />
  );
}

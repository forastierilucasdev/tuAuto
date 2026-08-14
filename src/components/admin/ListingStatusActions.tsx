"use client";

import { useRouter } from "next/navigation";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  adminRestoreListingAction,
  adminSetListingStatusAction,
  adminSoftDeleteListingAction,
} from "@/server/actions/admin/listings.actions";
import type { ListingStatus } from "@/generated/prisma/client";

const TRANSITIONS: { status: ListingStatus; label: string; message: string }[] = [
  { status: "ACTIVE", label: "Marcar Activa", message: "La publicación vuelve a mostrarse en el catálogo." },
  { status: "PAUSADA", label: "Pausar", message: "La publicación deja de mostrarse en el catálogo." },
  { status: "SOLD", label: "Marcar Vendida", message: "Se marca como vendida (estado terminal)." },
];

export function ListingStatusActions({
  listingId,
  deletedAt,
  canEdit,
  canDelete,
}: {
  listingId: string;
  deletedAt: Date | null;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {!deletedAt &&
        TRANSITIONS.map((t) => (
          <AdminConfirmButton
            key={t.status}
            label={t.label}
            variant="outline"
            disabled={!canEdit}
            confirmMessage={t.message}
            onConfirm={() => adminSetListingStatusAction(listingId, t.status)}
            onSuccess={() => router.refresh()}
          />
        ))}

      {deletedAt ? (
        <AdminConfirmButton
          label="Restaurar"
          variant="success"
          disabled={!canDelete}
          confirmMessage="La publicación vuelve a ser visible normalmente."
          onConfirm={() => adminRestoreListingAction(listingId)}
          onSuccess={() => router.refresh()}
        />
      ) : (
        <AdminConfirmButton
          label="Dar de baja"
          variant="destructive"
          disabled={!canDelete}
          confirmMessage="La publicación deja de verse en el catálogo y en el panel del dueño. Queda guardada, se puede restaurar."
          onConfirm={() => adminSoftDeleteListingAction(listingId)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}

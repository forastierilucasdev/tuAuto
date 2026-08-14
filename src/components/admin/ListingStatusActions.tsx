"use client";

import { useRouter } from "next/navigation";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { ReasonConfirmModal } from "@/components/admin/ReasonConfirmModal";
import { SuspendActionModal } from "@/components/admin/SuspendActionModal";
import {
  adminPauseListingAction,
  adminRestoreListingAction,
  adminSetListingStatusAction,
  adminSoftDeleteListingAction,
  adminSuspendListingAction,
  adminUnsuspendListingAction,
} from "@/server/actions/admin/listings.actions";

export function ListingStatusActions({
  listingId,
  deletedAt,
  isSuspended,
  ownerAvailablePublications,
  canEdit,
  canDelete,
}: {
  listingId: string;
  deletedAt: Date | null;
  isSuspended: boolean;
  /** Cupo disponible del dueño (ver `getAvailablePublications`) — solo para avisar antes de "Marcar Activa", nunca bloquea ni se consume acá (`adminSetListingStatus` no toca cupo a propósito). */
  ownerAvailablePublications: number;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {!deletedAt && (
        <AdminConfirmButton
          label="Marcar Activa"
          variant="outline"
          disabled={!canEdit}
          confirmMessage={
            ownerAvailablePublications > 0
              ? "La publicación vuelve a mostrarse en el catálogo."
              : "La publicación vuelve a mostrarse en el catálogo. Atención: el dueño no tiene publicaciones disponibles — esta es una excepción administrativa, no consume ni descuenta cupo."
          }
          onConfirm={() => adminSetListingStatusAction(listingId, "ACTIVE")}
          onSuccess={() => router.refresh()}
        />
      )}

      {!deletedAt && (
        <ReasonConfirmModal
          label="Pausar"
          confirmLabel="Pausar"
          variant="outline"
          disabled={!canEdit}
          description="La publicación deja de mostrarse en el catálogo hasta que se reactive. Contanos el motivo para el registro de auditoría."
          onConfirm={(reason) => adminPauseListingAction(listingId, reason)}
          onSuccess={() => router.refresh()}
        />
      )}

      {!deletedAt && (
        <AdminConfirmButton
          label="Marcar Vendida"
          variant="outline"
          disabled={!canEdit}
          confirmMessage="Se marca como vendida (estado terminal)."
          onConfirm={() => adminSetListingStatusAction(listingId, "SOLD")}
          onSuccess={() => router.refresh()}
        />
      )}

      {!deletedAt &&
        (isSuspended ? (
          <AdminConfirmButton
            label="Reactivar (quitar suspensión)"
            variant="success"
            disabled={!canEdit}
            confirmMessage="La publicación deja de estar suspendida de inmediato."
            onConfirm={() => adminUnsuspendListingAction(listingId)}
            onSuccess={() => router.refresh()}
          />
        ) : (
          <SuspendActionModal
            label="Suspender por días"
            entityLabel="La publicación"
            disabled={!canEdit}
            onConfirm={(days, reason) => adminSuspendListingAction(listingId, days, reason)}
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
        <ReasonConfirmModal
          label="Dar de baja"
          confirmLabel="Dar de baja"
          variant="destructive"
          disabled={!canDelete}
          description="La publicación deja de verse en el catálogo y en el panel del dueño. Queda guardada, se puede restaurar. Contanos el motivo para el registro de auditoría."
          onConfirm={(reason) => adminSoftDeleteListingAction(listingId, reason)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}

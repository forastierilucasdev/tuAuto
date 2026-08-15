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
  validateAndActivateListingAction,
} from "@/server/actions/admin/listings.actions";
import type { ListingStatus } from "@/generated/prisma/client";

export function ListingStatusActions({
  listingId,
  status,
  deletedAt,
  isSuspended,
  ownerAvailablePublications,
  hasPendingReferences,
  canEdit,
  canDelete,
}: {
  listingId: string;
  status: ListingStatus;
  deletedAt: Date | null;
  isSuspended: boolean;
  /** Cupo disponible del dueño (ver `getAvailablePublications`) — solo para avisar antes de "Marcar Activa", nunca bloquea ni se consume acá (`adminSetListingStatus` no toca cupo a propósito). */
  ownerAvailablePublications: number;
  /** `true` si todavía tiene `pendingTaxonomyRequestId`/`pendingLocalityRequestId` sin resolver — bloquea "Validar datos" hasta que se apruebe esa solicitud en la cola de pendientes. */
  hasPendingReferences: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDIENTE_APROBACION" && !deletedAt && (
        <AdminConfirmButton
          label="Validar datos"
          variant="success"
          disabled={!canEdit || hasPendingReferences}
          confirmMessage={
            ownerAvailablePublications > 0
              ? "La publicación pasa a Activa y se descuenta 1 publicación disponible del dueño."
              : "Atención: el dueño no tiene publicaciones disponibles — la validación va a fallar por falta de cupo. Otorgale cupo manualmente si corresponde antes de reintentar."
          }
          onConfirm={() => validateAndActivateListingAction(listingId)}
          onSuccess={() => router.refresh()}
        />
      )}

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

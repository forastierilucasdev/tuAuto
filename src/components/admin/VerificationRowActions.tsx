"use client";

import { useRouter } from "next/navigation";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { approveVerificationAction, rejectVerificationAction } from "@/server/actions/admin/verifications.actions";

export function VerificationRowActions({ requestId, canEdit }: { requestId: string; canEdit: boolean }) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <AdminConfirmButton
        label="Aprobar"
        variant="success"
        disabled={!canEdit}
        confirmMessage="El usuario pasa a mostrar la insignia 'Vendedor verificado' en sus publicaciones."
        onConfirm={() => approveVerificationAction(requestId)}
        onSuccess={() => router.refresh()}
      />
      <AdminConfirmButton
        label="Rechazar"
        variant="destructive"
        disabled={!canEdit}
        confirmMessage="La solicitud queda marcada como rechazada. El usuario puede volver a enviar otra."
        onConfirm={() => rejectVerificationAction(requestId)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

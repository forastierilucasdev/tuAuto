"use client";

import { useRouter } from "next/navigation";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { togglePlanActiveAction } from "@/server/actions/admin/subscriptions.actions";

export function PlanActiveToggle({ planCode, isActive, canEdit }: { planCode: string; isActive: boolean; canEdit: boolean }) {
  const router = useRouter();

  return (
    <AdminConfirmButton
      label={isActive ? "Dar de baja" : "Reactivar"}
      variant={isActive ? "destructive" : "success"}
      disabled={!canEdit}
      confirmMessage={
        isActive
          ? "El plan deja de ofrecerse a los usuarios (los que ya lo tienen no se ven afectados)."
          : "El plan vuelve a ofrecerse a los usuarios."
      }
      onConfirm={() => togglePlanActiveAction(planCode, !isActive)}
      onSuccess={() => router.refresh()}
    />
  );
}

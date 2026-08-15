"use client";

import { useRouter } from "next/navigation";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";

type ActionResult = { error?: string; success?: boolean } | undefined;

/** Dar de baja/reactivar genérico para filas de catálogo (marca/modelo/versión) — mismo patrón que `PlanActiveToggle`/`VehicleTypeActiveToggle`, parametrizado para no repetirlo una tercera vez. */
export function EntityActiveToggle({
  isActive,
  canEdit,
  offMessage,
  onMessage,
  onToggle,
}: {
  isActive: boolean;
  canEdit: boolean;
  offMessage: string;
  onMessage: string;
  onToggle: (nextActive: boolean) => Promise<ActionResult>;
}) {
  const router = useRouter();

  return (
    <AdminConfirmButton
      label={isActive ? "Dar de baja" : "Reactivar"}
      variant={isActive ? "destructive" : "success"}
      disabled={!canEdit}
      confirmMessage={isActive ? offMessage : onMessage}
      onConfirm={() => onToggle(!isActive)}
      onSuccess={() => router.refresh()}
    />
  );
}

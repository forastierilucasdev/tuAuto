"use client";

import { useRouter } from "next/navigation";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { toggleVehicleTypeActiveAction } from "@/server/actions/admin/vehicle-types.actions";

export function VehicleTypeActiveToggle({ id, isActive, canEdit }: { id: string; isActive: boolean; canEdit: boolean }) {
  const router = useRouter();

  return (
    <AdminConfirmButton
      label={isActive ? "Dar de baja" : "Reactivar"}
      variant={isActive ? "destructive" : "success"}
      disabled={!canEdit}
      confirmMessage={
        isActive
          ? "El tipo deja de ofrecerse para publicar/filtrar (las publicaciones que ya lo usan no se ven afectadas)."
          : "El tipo vuelve a estar disponible."
      }
      onConfirm={() => toggleVehicleTypeActiveAction(id, !isActive)}
      onSuccess={() => router.refresh()}
    />
  );
}

"use client";

import { useRouter } from "next/navigation";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { seedProvincesAction } from "@/server/actions/admin/locations.actions";

/** Siembra en un clic las 24 provincias fijas de `constants.ts` — idempotente, omite las que ya existen. */
export function SeedProvincesButton({ canEdit }: { canEdit: boolean }) {
  const router = useRouter();

  return (
    <AdminConfirmButton
      label="Cargar provincias registradas"
      confirmMessage="Se van a crear las provincias del listado fijo (Buenos Aires, CABA, Córdoba, etc.) que todavía no existan en esta tabla. Las que ya están cargadas no se duplican."
      variant="outline"
      disabled={!canEdit}
      onConfirm={() => seedProvincesAction()}
      onSuccess={() => router.refresh()}
    />
  );
}

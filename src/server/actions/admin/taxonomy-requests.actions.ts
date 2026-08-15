"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import { addTaxonomyRequestNote, approveTaxonomyRequest, getTaxonomyRequestById } from "@/server/data/admin/taxonomy-requests";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

function revalidateTaxonomyRequests() {
  revalidatePath("/admin/vehiculos/pendientes");
  revalidatePath("/admin/vehiculos");
  revalidatePath("/admin/publicaciones");
  revalidatePath("/");
  revalidatePath("/catalogo");
}

/**
 * "Aprobar" (mini-form: el admin confirma/edita el nombre final antes de
 * crear las filas reales) — destraba TODOS los listings vinculados a esta
 * solicitud de una, pero no los publica: cada uno sigue esperando su propia
 * "Validar datos" (Fase 9, dos pasos separados a propósito).
 */
export async function approveTaxonomyRequestAction(
  requestId: string,
  data: { brandName: string; modelName: string; versionName: string }
): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const before = await getTaxonomyRequestById(requestId);
  if (!before) return { error: "Solicitud no encontrada." };

  const brandName = data.brandName.trim();
  const modelName = data.modelName.trim();
  const versionName = data.versionName.trim();
  if (!brandName || !modelName || !versionName) return { error: "Completá marca, modelo y versión." };

  const { unblockedListings } = await approveTaxonomyRequest(requestId, { brandName, modelName, versionName });
  await logAdminAction({
    adminId: session.user.id,
    action: "taxonomyRequest.approve",
    targetTable: "TaxonomyRequest",
    targetId: requestId,
    changes: {
      before: { brandName: before.brandName, modelName: before.modelName, versionName: before.versionName },
      after: { brandName, modelName, versionName, unblockedListings },
    },
  });

  revalidateTaxonomyRequests();
  return { success: true };
}

export async function addTaxonomyRequestNoteAction(requestId: string, note: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const before = await getTaxonomyRequestById(requestId);
  if (!before) return { error: "Solicitud no encontrada." };
  if (note.trim().length < 3) return { error: "Contanos la observación." };

  await addTaxonomyRequestNote(requestId, note.trim());
  await logAdminAction({
    adminId: session.user.id,
    action: "taxonomyRequest.addNote",
    targetTable: "TaxonomyRequest",
    targetId: requestId,
    changes: { before: { adminNote: before.adminNote }, after: { adminNote: note.trim() } },
  });

  revalidatePath("/admin/vehiculos/pendientes");
  return { success: true };
}

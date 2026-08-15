"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import { addLocalityRequestNote, approveLocalityRequest, getLocalityRequestById } from "@/server/data/admin/locality-requests";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

function revalidateLocalityRequests() {
  revalidatePath("/admin/ubicacion/pendientes");
  revalidatePath("/admin/ubicacion");
  revalidatePath("/admin/publicaciones");
  revalidatePath("/");
  revalidatePath("/catalogo");
}

/** Mismo criterio que `approveTaxonomyRequestAction`: destraba todos los listings vinculados, sin publicarlos. */
export async function approveLocalityRequestAction(requestId: string, data: { name: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("ubicacion", "edit");
  const before = await getLocalityRequestById(requestId);
  if (!before) return { error: "Solicitud no encontrada." };

  const name = data.name.trim();
  if (!name) return { error: "Completá el nombre de la localidad." };

  const { unblockedListings } = await approveLocalityRequest(requestId, { name });
  await logAdminAction({
    adminId: session.user.id,
    action: "localityRequest.approve",
    targetTable: "LocalityRequest",
    targetId: requestId,
    changes: { before: { name: before.name }, after: { name, unblockedListings } },
  });

  revalidateLocalityRequests();
  return { success: true };
}

export async function addLocalityRequestNoteAction(requestId: string, note: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("ubicacion", "edit");
  const before = await getLocalityRequestById(requestId);
  if (!before) return { error: "Solicitud no encontrada." };
  if (note.trim().length < 3) return { error: "Contanos la observación." };

  await addLocalityRequestNote(requestId, note.trim());
  await logAdminAction({
    adminId: session.user.id,
    action: "localityRequest.addNote",
    targetTable: "LocalityRequest",
    targetId: requestId,
    changes: { before: { adminNote: before.adminNote }, after: { adminNote: note.trim() } },
  });

  revalidatePath("/admin/ubicacion/pendientes");
  return { success: true };
}

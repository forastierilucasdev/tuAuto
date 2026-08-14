"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import { addVerificationNote, approveVerificationRequest } from "@/server/data/admin/verifications";
import { prisma } from "@/lib/prisma";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

/** Solo Superadmin: la matriz de permisos ("identidad": edit) ya lo restringe — ver `admin-permissions.ts`. */
export async function approveVerificationAction(requestId: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("identidad", "edit");
  const before = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
  if (!before) return { error: "Solicitud no encontrada." };

  const request = await approveVerificationRequest(requestId);
  await logAdminAction({
    adminId: session.user.id,
    action: "verification.approve",
    targetTable: "VerificationRequest",
    targetId: requestId,
    changes: { before: { status: before.status }, after: { status: "APPROVED" } },
  });

  revalidatePath("/admin/identidad");
  revalidatePath(`/admin/usuarios/${request.userId}`);
  return { success: true };
}

/** No es un rechazo definitivo: la solicitud sigue PENDING, la nota queda para la próxima revisión. */
export async function addVerificationNoteAction(requestId: string, note: string): Promise<AdminActionState> {
  const session = await requireAdminPermission("identidad", "edit");
  const before = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
  if (!before) return { error: "Solicitud no encontrada." };
  if (note.trim().length < 3) return { error: "Contanos la observación." };

  await addVerificationNote(requestId, note.trim());
  await logAdminAction({
    adminId: session.user.id,
    action: "verification.addNote",
    targetTable: "VerificationRequest",
    targetId: requestId,
    changes: { before: { adminNote: before.adminNote }, after: { adminNote: note.trim() } },
  });

  revalidatePath("/admin/identidad");
  revalidatePath(`/admin/usuarios/${before.userId}`);
  return { success: true };
}

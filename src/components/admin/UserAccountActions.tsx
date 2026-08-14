"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  assignAdminRoleAction,
  banUserAction,
  restoreUserAction,
  softDeleteUserAction,
  unbanUserAction,
  unlockUserLoginAction,
} from "@/server/actions/admin/users.actions";
import type { AdminRole } from "@/generated/prisma/client";

export function UserAccountActions({
  userId,
  isActive,
  deletedAt,
  currentAdminRole,
  isLocked,
  isSuperAdmin,
  isSelf,
  permissions,
}: {
  userId: string;
  isActive: boolean;
  deletedAt: Date | null;
  currentAdminRole: AdminRole | null;
  isLocked: boolean;
  isSuperAdmin: boolean;
  isSelf: boolean;
  permissions: { canEdit: boolean; canDelete: boolean };
}) {
  const router = useRouter();
  const [role, setRole] = React.useState<string>(currentAdminRole ?? "");
  const [roleError, setRoleError] = React.useState<string>();
  const [rolePending, setRolePending] = React.useState(false);

  async function saveRole() {
    setRolePending(true);
    setRoleError(undefined);
    const result = await assignAdminRoleAction(userId, role === "" ? null : (role as AdminRole));
    setRolePending(false);
    if (result?.error) {
      setRoleError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {isActive ? (
          <AdminConfirmButton
            label="Banear"
            variant="destructive"
            disabled={!permissions.canEdit}
            confirmMessage="El usuario no va a poder iniciar sesión hasta que lo desbanees. Sus publicaciones siguen visibles."
            onConfirm={() => banUserAction(userId)}
            onSuccess={() => router.refresh()}
          />
        ) : (
          !deletedAt && (
            <AdminConfirmButton
              label="Desbanear"
              variant="success"
              disabled={!permissions.canEdit}
              confirmMessage="El usuario vuelve a poder iniciar sesión."
              onConfirm={() => unbanUserAction(userId)}
              onSuccess={() => router.refresh()}
            />
          )
        )}

        {deletedAt ? (
          <AdminConfirmButton
            label="Restaurar cuenta"
            variant="success"
            disabled={!permissions.canDelete}
            confirmMessage="La cuenta vuelve a ser visible/operable normalmente."
            onConfirm={() => restoreUserAction(userId)}
            onSuccess={() => router.refresh()}
          />
        ) : (
          <AdminConfirmButton
            label="Eliminar cuenta"
            variant="destructive"
            disabled={!permissions.canDelete || Boolean(currentAdminRole)}
            confirmMessage="Borrado lógico: la cuenta y sus publicaciones dejan de verse en todos lados, pero quedan guardadas. Se puede restaurar después."
            onConfirm={() => softDeleteUserAction(userId)}
            onSuccess={() => router.refresh()}
          />
        )}

        {isLocked && (
          <AdminConfirmButton
            label="Desbloquear inicio de sesión"
            variant="success"
            disabled={!permissions.canEdit}
            confirmMessage="Se levanta el bloqueo por intentos fallidos antes de que venza solo (30 minutos)."
            onConfirm={() => unlockUserLoginAction(userId)}
            onSuccess={() => router.refresh()}
          />
        )}
      </div>

      {isSuperAdmin && (
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-medium text-foreground">Rol de administrador</p>
          <div className="flex items-center gap-2">
            <Select value={role} onChange={(e) => setRole(e.target.value)} disabled={isSelf} className="max-w-52">
              <option value="">Sin rol (usuario normal)</option>
              <option value="LECTOR">Lector</option>
              <option value="EDITOR">Editor</option>
              <option value="SUPERADMIN">Superadministrador</option>
            </Select>
            <Button type="button" size="sm" disabled={rolePending || isSelf} onClick={saveRole}>
              {rolePending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
          {isSelf && <p className="mt-1 text-xs text-muted-foreground">No podés cambiar tu propio rol.</p>}
          {roleError && <p className="mt-1 text-xs text-danger">{roleError}</p>}
        </div>
      )}
    </div>
  );
}

import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AdminRole } from "@/generated/prisma/client";

// 3 roles fijos con la misma forma en los 5 módulos — no una tabla
// configurable de roles/permisos: para 3 roles que no van a cambiar, una
// matriz hardcodeada es más simple y sigue siendo 100% verificable server-side.
export const ADMIN_MODULES = [
  "usuarios",
  "publicaciones",
  "suscripciones",
  "destacados",
  "identidad",
  "auditoria",
] as const;
export type AdminModule = (typeof ADMIN_MODULES)[number];
export type AdminAction = "read" | "edit" | "delete";

const ROLE_PERMISSIONS: Record<AdminRole, Record<AdminModule, AdminAction[]>> = {
  LECTOR: {
    usuarios: ["read"],
    publicaciones: ["read"],
    suscripciones: ["read"],
    destacados: ["read"],
    identidad: ["read"],
    auditoria: ["read"],
  },
  EDITOR: {
    usuarios: ["read", "edit"],
    publicaciones: ["read", "edit"],
    suscripciones: ["read", "edit"],
    destacados: ["read", "edit"],
    // Aprobar/rechazar una verificación de identidad requiere además
    // `requireSuperAdminRole` — Editor puede ver la cola pero no resolverla
    // (ver `assignAdminRoleAction`/`resolveVerificationAction`).
    identidad: ["read"],
    auditoria: ["read"],
  },
  SUPERADMIN: {
    usuarios: ["read", "edit", "delete"],
    publicaciones: ["read", "edit", "delete"],
    suscripciones: ["read", "edit", "delete"],
    destacados: ["read", "edit", "delete"],
    identidad: ["read", "edit"],
    auditoria: ["read"],
  },
};

export function hasAdminPermission(role: AdminRole, module: AdminModule, action: AdminAction): boolean {
  return ROLE_PERMISSIONS[role][module].includes(action);
}

/** Permisos resueltos una vez por página/mutación — se pasan como prop a los componentes cliente, nunca se recalculan del lado del cliente. */
export function getModulePermissions(role: AdminRole, module: AdminModule) {
  return {
    canRead: hasAdminPermission(role, module, "read"),
    canEdit: hasAdminPermission(role, module, "edit"),
    canDelete: hasAdminPermission(role, module, "delete"),
  };
}

export class AdminPermissionError extends Error {
  constructor(message = "No tenés permiso para hacer esto.") {
    super(message);
    this.name = "AdminPermissionError";
  }
}

/**
 * Guardia de layout: hay sesión y esa sesión tiene algún rol de admin.
 * Redirige (no tira) — pensado para `admin/layout.tsx`, que renderiza antes
 * de que la página pida ningún permiso puntual.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.adminRole) redirect("/");
  return session as typeof session & { user: typeof session.user & { adminRole: AdminRole } };
}

/**
 * Guardia real de cada Server Action/página de admin — además del rol,
 * valida el permiso puntual (módulo + acción). Tira en vez de redirigir,
 * así el caller decide cómo mostrar el error — este es el único chequeo
 * que de verdad protege una mutación: la UI (botones ocultos/deshabilitados)
 * es una comodidad, nunca la barrera real.
 */
export async function requireAdminPermission(module: AdminModule, action: AdminAction) {
  const session = await requireAdmin();
  if (!hasAdminPermission(session.user.adminRole, module, action)) {
    throw new AdminPermissionError();
  }
  return session;
}

/**
 * Único caso que no entra en la matriz read/edit/delete: cambiar el rol de
 * otro admin. Editor también tiene `usuarios: edit` (para banear/editar
 * perfiles), pero nunca debe poder promover a alguien a SUPERADMIN — este
 * guard se llama ADEMÁS del chequeo normal, solo en esa acción puntual.
 */
export function requireSuperAdminRole(role: AdminRole) {
  if (role !== "SUPERADMIN") {
    throw new AdminPermissionError("Solo un Superadministrador puede hacer esto.");
  }
}

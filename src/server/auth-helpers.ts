import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Centraliza el `const session = await auth(); if (!session?.user)
 * redirect("/login");` que se repetía al principio de casi cada Server
 * Action de mutación (~13 veces en listing/payment/verification.actions.ts,
 * ver auditoría de seguridad). No lo uses en acciones que necesitan devolver
 * un error inline en vez de redirigir (ej. `changePasswordAction`) — ahí
 * seguí chequeando `session?.user` a mano.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

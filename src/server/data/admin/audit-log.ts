import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

export type AdminAuditTargetTable = "User" | "Listing" | "Payment" | "Plan" | "VerificationRequest";

/**
 * Se llama explícitamente al final de cada Server Action de admin que
 * mutó algo — nunca vía un hook automático de Prisma, mismo criterio
 * explícito que el resto del proyecto (ver `applyPaymentEffect` en
 * `payments.ts`). Cuando la mutación ya usa `$transaction`, esta escritura
 * va DENTRO de esa misma transacción — así una mutación nunca queda sin su
 * rastro de auditoría (ni viceversa).
 */
export async function logAdminAction(input: {
  adminId: string;
  action: string; // "user.ban", "listing.softDelete", "subscription.grant", ...
  targetTable: AdminAuditTargetTable;
  targetId: string;
  changes?: { before?: unknown; after?: unknown };
}) {
  const ip = getClientIp(await headers());
  await prisma.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetTable: input.targetTable,
      targetId: input.targetId,
      changes: input.changes ? JSON.parse(JSON.stringify(input.changes)) : undefined,
      ip,
    },
  });
}

export type AdminAuditFilters = {
  adminId?: string;
  targetTable?: AdminAuditTargetTable;
  from?: Date;
  to?: Date;
};

const AUDIT_LOG_PAGE_SIZE = 30;

export async function listAuditLog(filters: AdminAuditFilters, page = 1) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const where = {
    ...(filters.adminId ? { adminId: filters.adminId } : {}),
    ...(filters.targetTable ? { targetTable: filters.targetTable } : {}),
    ...(filters.from || filters.to
      ? { createdAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * AUDIT_LOG_PAGE_SIZE,
      take: AUDIT_LOG_PAGE_SIZE,
      include: { admin: { select: { fullName: true, email: true } } },
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return { entries, total, page: safePage, totalPages: Math.max(1, Math.ceil(total / AUDIT_LOG_PAGE_SIZE)) };
}

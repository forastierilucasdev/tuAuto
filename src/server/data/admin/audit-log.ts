import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

export type AdminAuditTargetTable =
  | "User"
  | "Listing"
  | "Payment"
  | "Plan"
  | "VerificationRequest"
  | "VehicleTypeCatalog"
  | "Brand"
  | "Model"
  | "Version"
  | "Province"
  | "Locality"
  | "TaxonomyRequest"
  | "LocalityRequest";

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
  adminSearch?: string;
  targetTable?: AdminAuditTargetTable;
  targetId?: string;
  from?: Date;
  to?: Date;
};

const AUDIT_LOG_PAGE_SIZE = 30;

export async function listAuditLog(filters: AdminAuditFilters, page = 1) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const where = {
    ...(filters.adminSearch
      ? {
          admin: {
            OR: [
              { email: { contains: filters.adminSearch, mode: "insensitive" as const } },
              { fullName: { contains: filters.adminSearch, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
    ...(filters.targetTable ? { targetTable: filters.targetTable } : {}),
    ...(filters.targetId ? { targetId: filters.targetId } : {}),
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

export type AuditTargetInfo = { label: string; href?: string };

/**
 * Resuelve `targetTable · targetId` (un ID pelado) a algo legible —
 * agrupado por tabla y consultado en una sola query por tabla (nunca una
 * query por fila, aunque la página tenga 30 entradas). Si el registro ya
 * no existe (borrado físico, caso raro), esa entrada simplemente no
 * aparece en el mapa — el que llama muestra el fallback crudo.
 */
export async function resolveAuditTargets(
  entries: { targetTable: AdminAuditTargetTable; targetId: string }[]
): Promise<Map<string, AuditTargetInfo>> {
  const idsByTable = new Map<AdminAuditTargetTable, Set<string>>();
  for (const entry of entries) {
    if (!idsByTable.has(entry.targetTable)) idsByTable.set(entry.targetTable, new Set());
    idsByTable.get(entry.targetTable)!.add(entry.targetId);
  }

  const result = new Map<string, AuditTargetInfo>();

  const userIds = [...(idsByTable.get("User") ?? [])];
  if (userIds.length > 0) {
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } });
    for (const user of users) {
      result.set(`User:${user.id}`, { label: `${user.fullName} (${user.email})`, href: `/admin/usuarios/${user.id}` });
    }
  }

  const listingIds = [...(idsByTable.get("Listing") ?? [])];
  if (listingIds.length > 0) {
    const listings = await prisma.listing.findMany({ where: { id: { in: listingIds } }, select: { id: true, title: true } });
    for (const listing of listings) {
      result.set(`Listing:${listing.id}`, { label: listing.title, href: `/admin/publicaciones/${listing.id}` });
    }
  }

  const paymentIds = [...(idsByTable.get("Payment") ?? [])];
  if (paymentIds.length > 0) {
    const payments = await prisma.payment.findMany({ where: { id: { in: paymentIds } }, select: { id: true, description: true, userId: true } });
    for (const payment of payments) {
      result.set(`Payment:${payment.id}`, { label: payment.description, href: `/admin/usuarios/${payment.userId}` });
    }
  }

  const planCodes = [...(idsByTable.get("Plan") ?? [])];
  if (planCodes.length > 0) {
    const plans = await prisma.plan.findMany({ where: { code: { in: planCodes } }, select: { code: true, name: true } });
    for (const plan of plans) {
      result.set(`Plan:${plan.code}`, { label: plan.name });
    }
  }

  const verificationIds = [...(idsByTable.get("VerificationRequest") ?? [])];
  if (verificationIds.length > 0) {
    const requests = await prisma.verificationRequest.findMany({
      where: { id: { in: verificationIds } },
      select: { id: true, user: { select: { id: true, fullName: true } } },
    });
    for (const request of requests) {
      result.set(`VerificationRequest:${request.id}`, {
        label: `Identidad de ${request.user.fullName}`,
        href: `/admin/usuarios/${request.user.id}`,
      });
    }
  }

  const vehicleTypeIds = [...(idsByTable.get("VehicleTypeCatalog") ?? [])];
  if (vehicleTypeIds.length > 0) {
    const vehicleTypes = await prisma.vehicleTypeCatalog.findMany({
      where: { id: { in: vehicleTypeIds } },
      select: { id: true, label: true },
    });
    for (const vehicleType of vehicleTypes) {
      result.set(`VehicleTypeCatalog:${vehicleType.id}`, { label: vehicleType.label, href: "/admin/vehiculos" });
    }
  }

  const brandIds = [...(idsByTable.get("Brand") ?? [])];
  if (brandIds.length > 0) {
    const brands = await prisma.brand.findMany({ where: { id: { in: brandIds } }, select: { id: true, name: true } });
    for (const brand of brands) {
      result.set(`Brand:${brand.id}`, { label: brand.name, href: "/admin/vehiculos?tab=marcas" });
    }
  }

  const modelIds = [...(idsByTable.get("Model") ?? [])];
  if (modelIds.length > 0) {
    const models = await prisma.model.findMany({
      where: { id: { in: modelIds } },
      select: { id: true, name: true, brand: { select: { name: true } } },
    });
    for (const model of models) {
      result.set(`Model:${model.id}`, { label: `${model.brand.name} ${model.name}`, href: "/admin/vehiculos?tab=modelos" });
    }
  }

  const versionIds = [...(idsByTable.get("Version") ?? [])];
  if (versionIds.length > 0) {
    const versions = await prisma.version.findMany({
      where: { id: { in: versionIds } },
      select: { id: true, name: true, model: { select: { name: true } } },
    });
    for (const version of versions) {
      result.set(`Version:${version.id}`, { label: `${version.model.name} ${version.name}`, href: "/admin/vehiculos?tab=versiones" });
    }
  }

  const provinceIds = [...(idsByTable.get("Province") ?? [])];
  if (provinceIds.length > 0) {
    const provinces = await prisma.province.findMany({ where: { id: { in: provinceIds } }, select: { id: true, name: true } });
    for (const province of provinces) {
      result.set(`Province:${province.id}`, { label: province.name, href: "/admin/ubicacion" });
    }
  }

  const localityIds = [...(idsByTable.get("Locality") ?? [])];
  if (localityIds.length > 0) {
    const localities = await prisma.locality.findMany({
      where: { id: { in: localityIds } },
      select: { id: true, name: true, province: { select: { id: true, name: true } } },
    });
    for (const locality of localities) {
      result.set(`Locality:${locality.id}`, {
        label: `${locality.province.name} · ${locality.name}`,
        href: `/admin/ubicacion/${locality.province.id}`,
      });
    }
  }

  const taxonomyRequestIds = [...(idsByTable.get("TaxonomyRequest") ?? [])];
  if (taxonomyRequestIds.length > 0) {
    const requests = await prisma.taxonomyRequest.findMany({
      where: { id: { in: taxonomyRequestIds } },
      select: { id: true, brandName: true, modelName: true },
    });
    for (const request of requests) {
      result.set(`TaxonomyRequest:${request.id}`, {
        label: `${request.brandName} ${request.modelName}`,
        href: "/admin/vehiculos/pendientes",
      });
    }
  }

  const localityRequestIds = [...(idsByTable.get("LocalityRequest") ?? [])];
  if (localityRequestIds.length > 0) {
    const requests = await prisma.localityRequest.findMany({
      where: { id: { in: localityRequestIds } },
      select: { id: true, name: true, province: { select: { name: true } } },
    });
    for (const request of requests) {
      result.set(`LocalityRequest:${request.id}`, {
        label: `${request.province.name} · ${request.name}`,
        href: "/admin/ubicacion/pendientes",
      });
    }
  }

  return result;
}

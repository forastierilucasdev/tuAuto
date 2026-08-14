import "server-only";
import { prisma } from "@/lib/prisma";
import { getVerificationDocumentSignedUrl } from "@/lib/supabase-storage";
import type { VerificationStatus } from "@/generated/prisma/client";

const VERIFICATION_PAGE_SIZE = 20;

export async function listVerificationRequestsForAdmin(status: VerificationStatus | "ALL" = "PENDING", page = 1) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const where = status === "ALL" ? {} : { status };

  const [requests, total] = await Promise.all([
    prisma.verificationRequest.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (safePage - 1) * VERIFICATION_PAGE_SIZE,
      take: VERIFICATION_PAGE_SIZE,
      include: { user: { select: { id: true, email: true, isVerified: true } } },
    }),
    prisma.verificationRequest.count({ where }),
  ]);

  // Cola de revisión, en la práctica siempre pocas filas — se resuelve una
  // URL firmada por foto acá mismo en vez de una página de detalle aparte.
  const requestsWithUrls = await Promise.all(
    requests.map(async (request) => {
      const [dniFrontUrl, dniBackUrl] = await Promise.all([
        getVerificationDocumentSignedUrl(request.dniFrontPath),
        getVerificationDocumentSignedUrl(request.dniBackPath),
      ]);
      return { ...request, dniFrontUrl, dniBackUrl };
    })
  );

  return {
    requests: requestsWithUrls,
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / VERIFICATION_PAGE_SIZE)),
  };
}

/** Aprobar marca al usuario como verificado (insignia "Vendedor verificado" en su publicación pública) — solo Superadmin, ver `admin-permissions.ts`. */
export async function approveVerificationRequest(requestId: string) {
  const request = await prisma.verificationRequest.findUniqueOrThrow({ where: { id: requestId } });
  await prisma.$transaction([
    prisma.verificationRequest.update({ where: { id: requestId }, data: { status: "APPROVED" } }),
    prisma.user.update({ where: { id: request.userId }, data: { isVerified: true } }),
  ]);
  return request;
}

/**
 * "Dejar pendiente con observación" (inconsistencias) — a propósito NO es
 * un rechazo definitivo: la solicitud sigue en la cola de `PENDING`, la
 * nota queda guardada para la próxima revisión (se sobrescribe cada vez).
 */
export async function addVerificationNote(requestId: string, note: string) {
  return prisma.verificationRequest.update({ where: { id: requestId }, data: { adminNote: note } });
}

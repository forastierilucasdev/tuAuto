import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// Lista no exhaustiva de user-agents conocidos de buscadores, previews de
// redes sociales/mensajería y herramientas de línea de comandos — no
// deberían inflar el contador de vistas.
const BOT_USER_AGENT =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|pinterest|bingpreview|preview|headless|curl|wget|python-requests|axios|node-fetch|ahrefsbot|semrushbot|mj12bot|petalbot|dotbot|yandexbot|duckduckbot|baiduspider|applebot/i;

function isBotUserAgent(userAgent: string): boolean {
  return userAgent.length === 0 || BOT_USER_AGENT.test(userAgent);
}

// Identifica al visitante sin guardar su IP en texto plano: si está
// logueado, por su userId (une vistas entre dispositivos); si no, por un
// hash de IP+user-agent — no perfecto, pero evita contar cada refresh de
// página como una vista nueva.
function visitorHash({ userId, ip, userAgent }: { userId?: string; ip: string; userAgent: string }): string {
  const raw = userId ? `user:${userId}` : `anon:${ip}:${userAgent}`;
  return createHash("sha256").update(raw).digest("hex");
}

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Registra una vista "real" de una publicación: nunca se llama para el
 * dueño (se filtra antes, en la página), descarta bots conocidos, y no
 * suma más de una vez por visitante/día (dedup vía `ListingView`, único por
 * publicación+visitante+día) — así refrescar la página no infla el
 * contador. `Listing.viewCount` es privado: solo se muestra en el panel
 * del dueño (`OwnerListingCard`), nunca en la publicación pública.
 */
export async function recordListingView({
  listingId,
  userId,
  ip,
  userAgent,
}: {
  listingId: string;
  userId?: string;
  ip: string;
  userAgent: string;
}): Promise<void> {
  if (isBotUserAgent(userAgent)) return;

  const hash = visitorHash({ userId, ip, userAgent });
  const viewDate = startOfDayUTC(new Date());

  try {
    await prisma.$transaction([
      prisma.listingView.create({ data: { listingId, visitorHash: hash, viewDate } }),
      prisma.listing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } }),
    ]);
  } catch (err) {
    // Mismo visitante, misma publicación, mismo día — ya contado, no es un error real.
    const isDuplicate = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
    if (!isDuplicate) throw err;
  }
}

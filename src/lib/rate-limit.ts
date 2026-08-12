import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Si hay credenciales de Upstash en el entorno, el límite se aplica sobre
// Redis (preciso con cualquier cantidad de instancias serverless). Si no,
// cae a un Map in-memory por proceso — sirve para desarrollo local, pero en
// producción con más de una instancia cada una tendría su propio contador.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN no configurados — usando el limitador in-memory, " +
      "que no es preciso con más de una instancia. Ver ARCHITECTURE.md."
  );
}

type Duration = `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d`;

function msToDuration(ms: number): Duration {
  if (ms % 60_000 === 0) return `${ms / 60_000} m`;
  if (ms % 1_000 === 0) return `${ms / 1_000} s`;
  return `${ms} ms`;
}

// Un `Ratelimit` fija su ventana/máximo al construirse, pero acá se llama
// con distintas combinaciones (login, registro, cambio de contraseña...) —
// se cachea una instancia por combinación en vez de crear una por request.
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(max: number, windowMs: number): Ratelimit {
  const cacheKey = `${max}:${windowMs}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(max, msToDuration(windowMs)),
      prefix: "motoresya-ratelimit",
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

type Bucket = { count: number; resetAt: number };
const inMemoryBuckets = new Map<string, Bucket>();

function pruneExpired(now: number) {
  if (inMemoryBuckets.size < 5000) return;
  for (const [key, bucket] of inMemoryBuckets) {
    if (bucket.resetAt < now) inMemoryBuckets.delete(key);
  }
}

function rateLimitInMemory(key: string, max: number, windowMs: number) {
  const now = Date.now();
  pruneExpired(now);

  const bucket = inMemoryBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    inMemoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1 };
  }

  if (bucket.count >= max) {
    return { success: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { success: true, remaining: max - bucket.count };
}

/**
 * El rate limit de login/registro/recuperar contraseña es por email — a
 * propósito, para no trabar a alguien detrás de un NAT/IP compartida. Pero
 * eso solo deja enumerar cuentas probando un email distinto por request sin
 * disparar nunca ese límite. Este segundo límite, por IP, lo tapa (umbral
 * más alto porque una oficina/4G puede compartir IP entre varios usuarios
 * legítimos). `x-forwarded-for` lo pone la plataforma (Vercel) — no es
 * spoofeable por el cliente en ese entorno.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip") || "unknown";
}

export async function rateLimit(
  key: string,
  { max = 5, windowMs = 5 * 60_000 }: { max?: number; windowMs?: number } = {}
): Promise<{ success: boolean; remaining: number; retryAfterMs?: number }> {
  if (redis) {
    const result = await getUpstashLimiter(max, windowMs).limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      retryAfterMs: result.success ? undefined : Math.max(0, result.reset - Date.now()),
    };
  }
  return rateLimitInMemory(key, max, windowMs);
}

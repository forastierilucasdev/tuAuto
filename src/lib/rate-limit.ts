import "server-only";

// Limitador in-memory por clave (ej. "login:email@dominio.com"). Sirve para
// el prototipo en un único proceso Node.js, pero NO es preciso con múltiples
// instancias serverless (cada instancia tiene su propio Map). Para producción,
// reemplazar por @upstash/ratelimit + Redis. Ver ARCHITECTURE.md / ERRORES.md.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function pruneExpired(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  { max = 5, windowMs = 5 * 60_000 }: { max?: number; windowMs?: number } = {}
) {
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1 };
  }

  if (bucket.count >= max) {
    return { success: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { success: true, remaining: max - bucket.count };
}

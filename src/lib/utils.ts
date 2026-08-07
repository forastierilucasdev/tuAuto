import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: "ARS" | "USD" = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** `unit`: "km" para autos/camionetas/monopatines, "horas" para lanchas/barcos (ver `lib/constants.ts`). */
export function formatKm(value: number | null, unit: "km" | "horas" = "km") {
  if (value === null) return "—";
  return `${new Intl.NumberFormat("es-AR").format(value)} ${unit}`;
}

/** "Juan Pérez" -> "JP". Nombres de una sola palabra devuelven una sola letra. */
export function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Días enteros que faltan hasta `expiresAt` (nunca negativo). `null`/pasado
 * → 0. `now` es opcional: en un componente de cliente, pasar un `now`
 * capturado una sola vez (lazy `useState`) evita llamar a `Date.now()`
 * directamente en el render (impuro).
 */
export function daysRemaining(expiresAt: Date | null, now: number = Date.now()): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((expiresAt.getTime() - now) / 86400000));
}

/** Evita "open redirect": solo acepta una ruta relativa propia del sitio. */
export function safeRedirectTarget(value: string | null | undefined) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export function buildWhatsAppLink(phone: string, message: string) {
  const digitsOnly = phone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Default de Next.js es 1MB — el wizard de publicar permite hasta 6
    // fotos de 5MB c/u (30MB), así que cualquier publicación con fotos
    // reales superaba el límite y el navegador mostraba un error de
    // servidor genérico (la request se cortaba antes de llegar al código).
    serverActions: { bodySizeLimit: "32mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    const baseHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    // Solo en producción: en dev, el CSP rompe el websocket de Hot Module
    // Reload de Turbopack (necesitaría reglas `connect-src`/`script-src`
    // adicionales solo para localhost, y no vale la pena el riesgo — Vercel
    // sirve siempre sobre HTTPS, así que HSTS tampoco aporta nada en dev).
    if (process.env.NODE_ENV === "production") {
      // Sin nonces: Next.js necesita inline scripts propios para hidratar
      // (streaming de RSC), así que `script-src` lleva 'unsafe-inline'. Sigue
      // bloqueando la carga de scripts de otro origen (la forma más común de
      // explotar un XSS/inyección) y, al no usar `dangerouslySetInnerHTML`
      // en ningún componente (auditado), el riesgo residual es bajo.
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://picsum.photos https://*.supabase.co",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ].join("; ");

      baseHeaders.push(
        { key: "Content-Security-Policy", value: csp },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
      );
    }

    return [{ source: "/:path*", headers: baseHeaders }];
  },
};

export default nextConfig;

"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Envuelve la app en el SessionProvider de Auth.js para que componentes
 * cliente (ej. Header) puedan leer el estado de sesión de forma reactiva
 * con `useSession()`, en vez de depender de un render de servidor que puede
 * quedar "pegado" en el caché de navegación (bfcache) al volver atrás.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

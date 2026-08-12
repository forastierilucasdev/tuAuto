import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Reemplaza a "middleware.ts" (renombrado a "proxy.ts" en Next.js 16, misma
// funcionalidad). Chequeo optimista basado en la cookie de sesión — cada
// Server Action de mutación vuelve a verificar la sesión y la pertenencia
// del recurso; no depender solo de este archivo (ver ARCHITECTURE.md).
export default auth((req) => {
  const isLoggedIn = Boolean(req.auth?.user);
  const { pathname, search } = req.nextUrl;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};

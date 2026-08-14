import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { AccountType, AdminRole } from "@/generated/prisma/client";
import { loginSchema } from "@/lib/validations/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  findUserForAuth,
  getSessionState,
  recordFailedAdminLogin,
  recordSuccessfulAdminLogin,
  touchLastLogin,
} from "@/server/data/users";

// Sesión de admin inactiva por más de esto se corta sola en el próximo
// request — solo aplica a tokens con `adminRole` (ver callback `jwt`), un
// usuario normal conserva la duración de sesión habitual.
const ADMIN_INACTIVITY_TIMEOUT_MS = 30 * 60_000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Necesario detrás del proxy de Vercel (y de cualquier reverse proxy) para
  // que Auth.js confíe en el header `Host` al armar las URLs de callback.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const limited = await rateLimit(`login:${email}`, { max: 5, windowMs: 5 * 60_000 });
        const ip = getClientIp(request.headers);
        const ipLimited = await rateLimit(`login-ip:${ip}`, { max: 30, windowMs: 5 * 60_000 });
        if (!limited.success || !ipLimited.success) return null;

        const user = await findUserForAuth(email);
        if (!user || !user.isActive || user.deletedAt) return null;

        const isAdmin = Boolean(user.adminRole);
        // Bloqueo por intentos fallidos, solo para cuentas de admin (ver
        // `recordFailedAdminLogin`) — se chequea antes de comparar la
        // contraseña, así una cuenta bloqueada rechaza incluso con la
        // contraseña correcta. Mismo mensaje de error que cualquier otro
        // rechazo (más abajo, `return null`) — a propósito: si el error
        // fuera distinto acá, alguien probando emails al azar podría usar
        // esa diferencia como oráculo para descubrir cuáles son cuentas de
        // admin.
        if (isAdmin && user.lockedUntil && user.lockedUntil.getTime() > Date.now()) return null;

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          if (isAdmin) await recordFailedAdminLogin(user.id);
          return null;
        }

        // Login de admin exitoso: reinicia el contador de intentos fallidos
        // y fuerza "sesión única" (revisar `recordSuccessfulAdminLogin`)
        // incrementando `sessionVersion` — cualquier sesión de admin abierta
        // en otro dispositivo/navegador se corta en su próximo request.
        const sessionVersion = isAdmin ? await recordSuccessfulAdminLogin(user.id) : user.sessionVersion;

        await touchLastLogin(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          accountType: user.accountType,
          sessionVersion,
          adminRole: user.adminRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.accountType = user.accountType as AccountType;
        token.sessionVersion = user.sessionVersion;
        token.adminRole = user.adminRole as AdminRole | null;
        if (user.adminRole) token.adminLastActivityAt = Date.now();
        return token;
      }
      // En cada request posterior al login: si `sessionVersion` ya no
      // coincide con el valor vigente en la base, la sesión se invalida acá
      // mismo (ver `changePasswordAction`) en vez de esperar a que el JWT
      // expire solo — así una cookie robada deja de servir apenas la
      // víctima cambia su contraseña. De paso se refresca `adminRole` — un
      // cambio de rol, un ban o un borrado lógico (admin o no) toman efecto
      // en el próximo request, sin invalidación aparte.
      const userId = token.id as string | undefined;
      if (userId) {
        const state = await getSessionState(userId);
        if (!state || state.sessionVersion !== token.sessionVersion) {
          token.id = undefined;
        } else {
          token.adminRole = state.adminRole;
          // Expiración por inactividad, exclusiva de sesiones de admin — un
          // usuario normal nunca tiene `adminLastActivityAt`, conserva la
          // duración de sesión habitual.
          if (state.adminRole) {
            // El cast es necesario: el tipo inferido de `token` en este
            // callback no respeta bien el módulo aumentado de `JWT` para
            // esta propiedad (queda como `{}`) — el valor en runtime sí es
            // siempre `number | undefined`, lo pusimos nosotros mismos.
            const lastActivity = (token.adminLastActivityAt as number | undefined) ?? 0;
            if (Date.now() - lastActivity > ADMIN_INACTIVITY_TIMEOUT_MS) {
              token.id = undefined;
            } else {
              token.adminLastActivityAt = Date.now();
            }
          } else {
            token.adminLastActivityAt = undefined;
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      // Sesión invalidada (ver arriba, `token.id` se vació) — sin sesión.
      if (!token.id) return null as unknown as typeof session;
      session.user.id = token.id as string;
      session.user.accountType = token.accountType as AccountType;
      session.user.adminRole = (token.adminRole ?? null) as AdminRole | null;
      return session;
    },
  },
});

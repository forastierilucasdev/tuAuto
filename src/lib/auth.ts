import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { AccountType } from "@/generated/prisma/client";
import { loginSchema } from "@/lib/validations/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { findUserForAuth, getSessionVersion, touchLastLogin } from "@/server/data/users";

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
        if (!user || !user.isActive) return null;

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        await touchLastLogin(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          accountType: user.accountType,
          sessionVersion: user.sessionVersion,
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
        return token;
      }
      // En cada request posterior al login: si `sessionVersion` ya no
      // coincide con el valor vigente en la base, la sesión se invalida acá
      // mismo (ver `changePasswordAction`) en vez de esperar a que el JWT
      // expire solo — así una cookie robada deja de servir apenas la
      // víctima cambia su contraseña.
      const userId = token.id as string | undefined;
      if (userId) {
        const currentVersion = await getSessionVersion(userId);
        if (currentVersion === null || currentVersion !== token.sessionVersion) {
          token.id = undefined;
        }
      }
      return token;
    },
    session({ session, token }) {
      // Sesión invalidada (ver arriba, `token.id` se vació) — sin sesión.
      if (!token.id) return null as unknown as typeof session;
      session.user.id = token.id as string;
      session.user.accountType = token.accountType as AccountType;
      return session;
    },
  },
});

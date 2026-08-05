import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { AccountType } from "@/generated/prisma/client";
import { loginSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/rate-limit";
import { findUserForAuth, touchLastLogin } from "@/server/data/users";

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
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const limited = rateLimit(`login:${email}`, { max: 5, windowMs: 5 * 60_000 });
        if (!limited.success) return null;

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
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.accountType = user.accountType as AccountType;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.accountType = token.accountType as AccountType;
      return session;
    },
  },
});

import type { DefaultSession } from "next-auth";
import type { AccountType } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    accountType: AccountType;
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      accountType: AccountType;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accountType?: AccountType;
    // Copiado del `User.sessionVersion` al loguearse; se compara contra el
    // valor vigente en cada request para invalidar sesiones robadas cuando
    // el dueño cambia su contraseña (ver `lib/auth.ts`).
    sessionVersion?: number;
  }
}

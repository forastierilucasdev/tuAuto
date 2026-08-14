import type { DefaultSession } from "next-auth";
import type { AccountType, AdminRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    accountType: AccountType;
    sessionVersion: number;
    // Null para el 99% de las cuentas — solo el panel /admin lo usa (ver
    // `lib/admin-permissions.ts`).
    adminRole: AdminRole | null;
  }

  interface Session {
    user: {
      id: string;
      accountType: AccountType;
      adminRole: AdminRole | null;
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
    adminRole?: AdminRole | null;
  }
}

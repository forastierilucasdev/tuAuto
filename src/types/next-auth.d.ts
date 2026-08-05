import type { DefaultSession } from "next-auth";
import type { AccountType } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    accountType: AccountType;
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
    id: string;
    accountType: AccountType;
  }
}

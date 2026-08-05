import "server-only";
import { prisma } from "@/lib/prisma";
import type { AccountType, User } from "@/generated/prisma/client";

export type SafeUser = {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  dni: string;
  phone: string;
  createdAt: Date;
};

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    accountType: user.accountType,
    dni: user.dni,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

/** Único uso permitido es dentro de `authorize()` de Auth.js, para comparar el hash. */
export async function findUserForAuth(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getFullProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      accountType: true,
      dni: true,
      phone: true,
      createdAt: true,
      agencyProfile: {
        select: { businessName: true, city: true, province: true, description: true, cuit: true },
      },
    },
  });
}

export async function findSafeUserById(id: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toSafeUser(user) : null;
}

export async function touchLastLogin(id: string) {
  await prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
}

export async function emailExists(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return Boolean(user);
}

export async function dniExists(dni: string) {
  const user = await prisma.user.findUnique({ where: { dni }, select: { id: true } });
  return Boolean(user);
}

export async function cuitExists(cuit: string) {
  const profile = await prisma.agencyProfile.findUnique({ where: { cuit }, select: { id: true } });
  return Boolean(profile);
}

export async function createParticularUser(data: {
  email: string;
  passwordHash: string;
  fullName: string;
  dni: string;
  phone: string;
}): Promise<SafeUser> {
  const user = await prisma.user.create({
    data: { ...data, accountType: "PARTICULAR" },
  });
  return toSafeUser(user);
}

export async function createAgencyUser(data: {
  email: string;
  passwordHash: string;
  fullName: string;
  dni: string;
  phone: string;
  businessName: string;
  cuit: string;
}): Promise<SafeUser> {
  const { businessName, cuit, ...userData } = data;
  const user = await prisma.user.create({
    data: {
      ...userData,
      accountType: "AGENCIA",
      agencyProfile: { create: { businessName, cuit } },
    },
  });
  return toSafeUser(user);
}

export async function updateProfile(
  id: string,
  data: Partial<Pick<User, "fullName" | "phone">> & {
    agencyProfile?: { businessName?: string; city?: string; province?: string; description?: string };
  }
) {
  const { agencyProfile, ...userData } = data;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userData,
      ...(agencyProfile ? { agencyProfile: { update: agencyProfile } } : {}),
    },
  });
  return toSafeUser(user);
}

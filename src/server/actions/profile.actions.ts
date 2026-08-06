"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  changePasswordSchema,
  updateAgencyProfileSchema,
  updateParticularProfileSchema,
} from "@/lib/validations/profile";
import { dniExists, findUserForAuth, getFullProfile, updatePassword, updateProfile } from "@/server/data/users";
import { isBusinessAccountType } from "@/lib/constants";
import { uploadAvatarImage } from "@/lib/supabase-storage";
import { validateImageFile } from "@/lib/image-validation";
import { rateLimit } from "@/lib/rate-limit";

export type ProfileActionState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

export async function getMyProfileAction() {
  const session = await auth();
  if (!session?.user) return null;
  return getFullProfile(session.user.id);
}

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Tenés que iniciar sesión para editar tu perfil." };
  }

  const raw = Object.fromEntries(formData);

  const avatarFile = formData.get("avatar");
  const hasNewAvatar = avatarFile instanceof File && avatarFile.size > 0;
  if (hasNewAvatar) {
    const error = validateImageFile(avatarFile, MAX_AVATAR_SIZE_BYTES);
    if (error) return { error };
  }

  const avatarUrl = hasNewAvatar ? await uploadAvatarImage(avatarFile, session.user.id) : undefined;

  if (isBusinessAccountType(session.user.accountType)) {
    const parsed = updateAgencyProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    if (await dniExists(parsed.data.dni, session.user.id)) {
      return { fieldErrors: { dni: ["Ya existe una cuenta registrada con ese DNI."] } };
    }
    const { fullName, dni, phone, businessName, city, province, description } = parsed.data;
    await updateProfile(session.user.id, {
      fullName,
      dni,
      phone,
      avatarUrl,
      agencyProfile: { businessName, city, province, description },
    });
  } else {
    const parsed = updateParticularProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    if (await dniExists(parsed.data.dni, session.user.id)) {
      return { fieldErrors: { dni: ["Ya existe una cuenta registrada con ese DNI."] } };
    }
    await updateProfile(session.user.id, { ...parsed.data, avatarUrl });
  }

  revalidatePath("/dashboard/perfil");
  return { success: true };
}

export async function changePasswordAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Tenés que iniciar sesión." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const limited = rateLimit(`change-password:${session.user.id}`, { max: 5, windowMs: 15 * 60_000 });
  if (!limited.success) {
    return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  const user = await findUserForAuth(session.user.email);
  if (!user) return { error: "No pudimos encontrar tu cuenta." };

  const currentMatches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!currentMatches) {
    return { fieldErrors: { currentPassword: ["La contraseña actual no es correcta."] } };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await updatePassword(user.id, newHash);

  return { success: true };
}

"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validations/profile";
import {
  convertToBusinessAccount,
  convertToParticularAccount,
  cuitExists,
  dniExists,
  findUserForAuth,
  getFullProfile,
  updatePassword,
  updateProfile,
} from "@/server/data/users";
import { uploadAgencyLogo, uploadAvatarImage } from "@/lib/supabase-storage";
import { validateImageFile } from "@/lib/image-validation";
import { rateLimit } from "@/lib/rate-limit";

export type ProfileActionState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * `avatarPositionX/Y`/`logoPositionX/Y` viajan fuera del schema de zod
 * (mismo criterio que `avatarUrl`/`logoUrl`, resueltos directo del
 * FormData): cada pantalla (ProfileForm/AccountTypeForm) solo manda la
 * posición de la imagen que le corresponde, la otra queda `undefined`
 * (no se toca). `undefined` si el campo no vino o no es un número 0-100
 * válido — nunca tira, nunca corrompe el punto de anclaje guardado.
 */
function readPositionField(formData: FormData, name: string): number | undefined {
  const raw = formData.get(name);
  if (typeof raw !== "string" || raw === "") return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  return Math.min(100, Math.max(0, Math.round(value)));
}

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

  // La sesión (JWT) puede tener un accountType desactualizado si se cambió
  // en un pedido anterior de la misma sesión — se busca el estado real acá.
  const currentProfile = await getFullProfile(session.user.id);
  if (!currentProfile) {
    return { error: "No pudimos encontrar tu cuenta." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const avatarFile = formData.get("avatar");
  const hasNewAvatar = avatarFile instanceof File && avatarFile.size > 0;
  if (hasNewAvatar) {
    const error = validateImageFile(avatarFile, MAX_AVATAR_SIZE_BYTES);
    if (error) return { error };
  }
  const avatarUrl = hasNewAvatar ? await uploadAvatarImage(avatarFile, session.user.id) : undefined;
  const avatarPositionX = readPositionField(formData, "avatarPositionX");
  const avatarPositionY = readPositionField(formData, "avatarPositionY");

  const logoFile = formData.get("logo");
  const hasNewLogo = logoFile instanceof File && logoFile.size > 0;
  if (hasNewLogo) {
    const error = validateImageFile(logoFile, MAX_AVATAR_SIZE_BYTES);
    if (error) return { error };
  }
  const logoUrl = hasNewLogo ? await uploadAgencyLogo(logoFile, session.user.id) : undefined;
  const logoPositionX = readPositionField(formData, "logoPositionX");
  const logoPositionY = readPositionField(formData, "logoPositionY");

  if (await dniExists(parsed.data.dni, session.user.id)) {
    return { fieldErrors: { dni: ["Ya existe una cuenta registrada con ese DNI."] } };
  }

  const wasBusiness = currentProfile.accountType !== "PARTICULAR";

  if (parsed.data.accountType === "PARTICULAR") {
    if (wasBusiness) {
      await convertToParticularAccount(session.user.id, {
        fullName: parsed.data.fullName,
        dni: parsed.data.dni,
        phone: parsed.data.phone,
        avatarUrl,
        avatarPositionX,
        avatarPositionY,
      });
    } else {
      await updateProfile(session.user.id, { ...parsed.data, avatarUrl, avatarPositionX, avatarPositionY });
    }
  } else {
    if (await cuitExists(parsed.data.cuit, session.user.id)) {
      return { fieldErrors: { cuit: ["Ya existe una cuenta registrada con ese CUIT."] } };
    }

    if (!wasBusiness) {
      await convertToBusinessAccount(session.user.id, parsed.data.accountType, {
        fullName: parsed.data.fullName,
        dni: parsed.data.dni,
        phone: parsed.data.phone,
        avatarUrl,
        avatarPositionX,
        avatarPositionY,
        businessName: parsed.data.businessName,
        cuit: parsed.data.cuit,
        city: parsed.data.city,
        province: parsed.data.province,
        description: parsed.data.description,
        logoUrl,
        logoPositionX,
        logoPositionY,
        address: parsed.data.address,
        website: parsed.data.website,
      });
    } else {
      await updateProfile(session.user.id, {
        fullName: parsed.data.fullName,
        dni: parsed.data.dni,
        phone: parsed.data.phone,
        avatarUrl,
        avatarPositionX,
        avatarPositionY,
        accountType: parsed.data.accountType,
        agencyProfile: {
          businessName: parsed.data.businessName,
          cuit: parsed.data.cuit,
          city: parsed.data.city,
          province: parsed.data.province,
          description: parsed.data.description,
          logoUrl,
          logoPositionX,
          logoPositionY,
          address: parsed.data.address,
          website: parsed.data.website,
        },
      });
    }
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

  const limited = await rateLimit(`change-password:${session.user.id}`, { max: 5, windowMs: 15 * 60_000 });
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

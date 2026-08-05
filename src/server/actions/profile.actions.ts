"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateAgencyProfileSchema, updateParticularProfileSchema } from "@/lib/validations/profile";
import { updateProfile } from "@/server/data/users";
import { isBusinessAccountType } from "@/lib/constants";
import { uploadAvatarImage } from "@/lib/supabase-storage";
import { validateImageFile } from "@/lib/image-validation";

export type ProfileActionState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

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
    const { fullName, phone, businessName, city, province, description } = parsed.data;
    await updateProfile(session.user.id, {
      fullName,
      phone,
      avatarUrl,
      agencyProfile: { businessName, city, province, description },
    });
  } else {
    const parsed = updateParticularProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    await updateProfile(session.user.id, { ...parsed.data, avatarUrl });
  }

  revalidatePath("/dashboard/perfil");
  return { success: true };
}

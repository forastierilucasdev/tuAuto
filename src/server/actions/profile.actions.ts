"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateAgencyProfileSchema, updateParticularProfileSchema } from "@/lib/validations/profile";
import { updateProfile } from "@/server/data/users";
import { isBusinessAccountType } from "@/lib/constants";

export type ProfileActionState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Tenés que iniciar sesión para editar tu perfil." };
  }

  const raw = Object.fromEntries(formData);

  if (isBusinessAccountType(session.user.accountType)) {
    const parsed = updateAgencyProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    const { fullName, phone, businessName, city, province, description } = parsed.data;
    await updateProfile(session.user.id, {
      fullName,
      phone,
      agencyProfile: { businessName, city, province, description },
    });
  } else {
    const parsed = updateParticularProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    await updateProfile(session.user.id, parsed.data);
  }

  revalidatePath("/dashboard/perfil");
  return { success: true };
}

"use server";

import { requireSession } from "@/server/auth-helpers";
import { verificationRequestSchema } from "@/lib/validations/verification";
import { validateImageFile } from "@/lib/image-validation";
import { uploadVerificationDocument } from "@/lib/supabase-storage";
import { createVerificationRequest } from "@/server/data/users";

export type VerificationActionState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function submitVerificationAction(
  _prevState: VerificationActionState,
  formData: FormData
): Promise<VerificationActionState> {
  const session = await requireSession();

  const parsed = verificationRequestSchema.safeParse({
    fullName: formData.get("fullName"),
    dni: formData.get("dni"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const dniFront = formData.get("dniFront");
  const dniBack = formData.get("dniBack");
  if (!(dniFront instanceof File) || dniFront.size === 0 || !(dniBack instanceof File) || dniBack.size === 0) {
    return { error: "Subí la foto del DNI de frente y de dorso." };
  }
  const frontError = validateImageFile(dniFront, MAX_FILE_SIZE_BYTES);
  if (frontError) return { error: frontError };
  const backError = validateImageFile(dniBack, MAX_FILE_SIZE_BYTES);
  if (backError) return { error: backError };

  const [dniFrontPath, dniBackPath] = await Promise.all([
    uploadVerificationDocument(dniFront, session.user.id, "frente"),
    uploadVerificationDocument(dniBack, session.user.id, "dorso"),
  ]);

  await createVerificationRequest({
    userId: session.user.id,
    ...parsed.data,
    dniFrontPath,
    dniBackPath,
  });

  return { success: true };
}

"use server";

import { requireSession } from "@/server/auth-helpers";
import { getFullProfile } from "@/server/data/users";
import { validateImageFile } from "@/lib/image-validation";
import { sendSupportEmail } from "@/lib/resend";

export type SupportActionState = { error?: string; success?: boolean } | undefined;

const MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Reporte de error a soporte@motoresya.com.ar — nombre/correo/teléfono del usuario y fecha/hora se agregan acá, no los pide el formulario. */
export async function submitSupportReportAction(
  _prevState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  const session = await requireSession();

  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 10) {
    return { error: "Contanos un poco más de detalle sobre qué pasó (mínimo 10 caracteres)." };
  }

  const screenshot = formData.get("screenshot");
  const hasScreenshot = screenshot instanceof File && screenshot.size > 0;
  let attachment: { filename: string; content: Buffer; contentType?: string } | undefined;
  if (hasScreenshot) {
    const error = validateImageFile(screenshot, MAX_SCREENSHOT_SIZE_BYTES);
    if (error) return { error };
    const buffer = Buffer.from(await screenshot.arrayBuffer());
    attachment = { filename: screenshot.name || "captura.png", content: buffer, contentType: screenshot.type };
  }

  const profile = await getFullProfile(session.user.id);
  if (!profile) return { error: "No pudimos encontrar tu cuenta." };

  const html = `
    <h2>Reporte de error — Motoresya</h2>
    <p><strong>Usuario:</strong> ${escapeHtml(profile.fullName)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(profile.email)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(profile.phone)}</p>
    <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString("es-AR")}</p>
    <hr />
    <p><strong>Descripción del error:</strong></p>
    <p>${escapeHtml(description).replace(/\n/g, "<br/>")}</p>
  `;

  const result = await sendSupportEmail({
    subject: `Reporte de error — ${profile.fullName}`,
    html,
    replyTo: profile.email,
    attachment,
  });

  if (!result.ok) return { error: result.error };
  return { success: true };
}

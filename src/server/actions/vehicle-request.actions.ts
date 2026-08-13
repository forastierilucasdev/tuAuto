"use server";

import { sendSupportEmail } from "@/lib/resend";

export type VehicleRequestActionState = { error?: string; success?: boolean } | undefined;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function optionalTrimmed(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : undefined;
}

/** Formulario público (sin login) de "avisame cuando publiquen algo así" — se manda por mail a soporte@motoresya.com.ar hasta que haya una bandeja propia para esto. */
export async function submitVehicleRequestAction(
  _prevState: VehicleRequestActionState,
  formData: FormData
): Promise<VehicleRequestActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) return { error: "Contanos tu nombre y apellido." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Ingresá un correo válido." };
  if (phone.length < 6) return { error: "Ingresá un teléfono de contacto." };

  const brand = optionalTrimmed(formData, "brand");
  const model = optionalTrimmed(formData, "model");
  const yearFrom = optionalTrimmed(formData, "yearFrom");
  const yearTo = optionalTrimmed(formData, "yearTo");
  const kmFrom = optionalTrimmed(formData, "kmFrom");
  const kmTo = optionalTrimmed(formData, "kmTo");

  const html = `
    <h2>Aviso de búsqueda de vehículo — Motoresya</h2>
    <p><strong>Nombre y apellido:</strong> ${escapeHtml(fullName)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>
    <hr />
    <p><strong>Marca:</strong> ${brand ? escapeHtml(brand) : "No especificada"}</p>
    <p><strong>Modelo:</strong> ${model ? escapeHtml(model) : "No especificado"}</p>
    <p><strong>Año:</strong> ${yearFrom ? escapeHtml(yearFrom) : "Sin mínimo"} — ${yearTo ? escapeHtml(yearTo) : "Sin máximo"}</p>
    <p><strong>Kilometraje:</strong> ${kmFrom ? escapeHtml(kmFrom) : "Sin mínimo"} — ${kmTo ? escapeHtml(kmTo) : "Sin máximo"}</p>
  `;

  const result = await sendSupportEmail({
    subject: `Aviso de búsqueda de vehículo — ${fullName}`,
    html,
    replyTo: email,
  });

  if (!result.ok) return { error: result.error };
  return { success: true };
}

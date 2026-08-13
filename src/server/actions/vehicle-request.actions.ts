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

/** Formulario público (sin login) de "avisame cuando publiquen algo así" — se manda por mail a soporte@motoresya.com.ar hasta que haya una bandeja propia para esto. Todos los campos son obligatorios. */
export async function submitVehicleRequestAction(
  _prevState: VehicleRequestActionState,
  formData: FormData
): Promise<VehicleRequestActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();

  if (fullName.length < 2) return { error: "Contanos tu nombre y apellido." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Ingresá un correo válido." };
  if (phone.length < 6) return { error: "Ingresá un teléfono de contacto." };
  if (brand.length < 2) return { error: "Ingresá la marca que buscás." };
  if (model.length < 1) return { error: "Ingresá el modelo que buscás." };

  const yearFrom = Number(formData.get("yearFrom"));
  const yearTo = Number(formData.get("yearTo"));
  const kmFrom = Number(formData.get("kmFrom"));
  const kmTo = Number(formData.get("kmTo"));

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(yearFrom) || yearFrom < 1900 || yearFrom > currentYear + 1) {
    return { error: "Ingresá un año 'desde' válido." };
  }
  if (!Number.isInteger(yearTo) || yearTo < yearFrom || yearTo > currentYear + 1) {
    return { error: "El año 'hasta' tiene que ser mayor o igual al 'desde'." };
  }
  if (!Number.isFinite(kmFrom) || kmFrom < 0) return { error: "Ingresá un kilometraje 'desde' válido." };
  if (!Number.isFinite(kmTo) || kmTo < kmFrom) {
    return { error: "El kilometraje 'hasta' tiene que ser mayor o igual al 'desde'." };
  }

  const html = `
    <h2>Aviso de búsqueda de vehículo — Motoresya</h2>
    <p><strong>Nombre y apellido:</strong> ${escapeHtml(fullName)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>
    <hr />
    <p><strong>Marca:</strong> ${escapeHtml(brand)}</p>
    <p><strong>Modelo:</strong> ${escapeHtml(model)}</p>
    <p><strong>Año:</strong> ${yearFrom} — ${yearTo}</p>
    <p><strong>Kilometraje:</strong> ${kmFrom} — ${kmTo}</p>
  `;

  const result = await sendSupportEmail({
    subject: `Aviso de búsqueda de vehículo — ${fullName}`,
    html,
    replyTo: email,
  });

  if (!result.ok) return { error: result.error };
  return { success: true };
}

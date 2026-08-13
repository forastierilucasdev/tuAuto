import "server-only";
import { Resend } from "resend";

// Sin RESEND_API_KEY (todavía no se cargó) no se instancia el cliente —
// sendSupportEmail() devuelve un error explícito en vez de fallar en
// silencio, así el usuario sabe que el reporte no salió (a diferencia del
// fallback "seguir sin validar" que se usa en rate-limit.ts/mercadopago.ts,
// acá no hay una alternativa segura: o se manda el mail, o no se manda).
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const SUPPORT_EMAIL = "soporte@motoresya.com.ar";

// Antes de verificar un dominio propio en Resend, solo se puede mandar
// desde este remitente de prueba (y solo a la casilla verificada de la
// cuenta) — se puede pisar con RESEND_FROM_EMAIL una vez que
// motoresya.com.ar esté verificado ahí.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Motoresya <onboarding@resend.dev>";

export async function sendSupportEmail({
  subject,
  html,
  replyTo,
  attachment,
}: {
  subject: string;
  html: string;
  replyTo?: string;
  attachment?: { filename: string; content: Buffer; contentType?: string };
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!resend) {
    return {
      ok: false,
      error: "El envío de reportes todavía no está configurado. Escribinos directamente a soporte@motoresya.com.ar mientras tanto.",
    };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: SUPPORT_EMAIL,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
      ...(attachment ? { attachments: [attachment] } : {}),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido al enviar el email." };
  }
}

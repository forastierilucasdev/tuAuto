import type { AdminAuditTargetTable } from "@/server/data/admin/audit-log";

// Frase legible por acción — si se agrega una acción nueva y no está acá,
// se muestra el código crudo como fallback (`ACTION_LABEL[action] ?? action`),
// nunca se rompe. Compartido entre `/admin/auditoria` y el historial por
// publicación en `/admin/publicaciones/[id]`.
export const ACTION_LABEL: Record<string, string> = {
  "listing.setFeatured": "Agregó/extendió destacado",
  "listing.removeFeaturedEarly": "Quitó destacado antes de tiempo",
  "listing.update": "Editó datos de la publicación",
  "listing.setStatus": "Cambió el estado de la publicación",
  "listing.pause": "Pausó la publicación",
  "listing.softDelete": "Dio de baja la publicación",
  "listing.suspend": "Suspendió la publicación",
  "listing.unsuspend": "Reactivó la publicación suspendida",
  "listing.restore": "Restauró la publicación",
  "verification.approve": "Aprobó la verificación de identidad",
  "verification.addNote": "Agregó una observación de identidad",
  "subscription.grant": "Otorgó/renovó una suscripción",
  "subscription.cancel": "Canceló la suscripción",
  "subscription.adjustPurchasedPublications": "Ajustó publicaciones compradas",
  "subscription.adjustFeaturedVouchers": "Ajustó vouchers de destacado",
  "plan.toggleActive": "Dio de baja / reactivó un plan",
  "plan.update": "Editó un plan",
  "payment.approveCash": "Aprobó un pago en efectivo",
  "user.ban": "Baneó la cuenta",
  "user.unban": "Desbaneó la cuenta",
  "user.softDelete": "Eliminó la cuenta (lógico)",
  "user.restore": "Restauró la cuenta",
  "user.unlockLogin": "Desbloqueó el inicio de sesión",
  "user.suspend": "Suspendió la cuenta",
  "user.unsuspend": "Reactivó la cuenta suspendida",
  "user.setAdminRole": "Cambió el rol de administrador",
};

export const TARGET_TABLE_LABEL: Record<AdminAuditTargetTable, string> = {
  User: "Usuario",
  Listing: "Publicación",
  Payment: "Pago",
  Plan: "Plan",
  VerificationRequest: "Verificación de identidad",
};

export const TARGET_TABLES: AdminAuditTargetTable[] = ["User", "Listing", "Payment", "Plan", "VerificationRequest"];

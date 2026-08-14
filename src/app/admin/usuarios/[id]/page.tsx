import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { UserAccountActions } from "@/components/admin/UserAccountActions";
import { UserSubscriptionActions } from "@/components/admin/UserSubscriptionActions";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { getUserForAdmin, isAccountLocked, isUserSuspended } from "@/server/data/admin/users";
import { FREE_PUBLICATION_QUOTA, getOwnerListingGroups } from "@/server/data/listings";
import { getPaymentHistory, getSubscriptionPlans, getSubscriptionStatus } from "@/server/data/payments";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { accountTypeLabel } from "@/lib/constants";

export const metadata: Metadata = { title: "Detalle de usuario | Admin" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const PAYMENT_STATUS_VARIANT = { APPROVED: "success", PENDING: "info", REJECTED: "danger" } as const;

export default async function AdminUserDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("usuarios", "read");
  const { id } = await props.params;

  const user = await getUserForAdmin(id);
  if (!user) notFound();

  const [listingGroups, payments, subscriptionPlans, subscriptionStatus, verification] = await Promise.all([
    getOwnerListingGroups(id),
    getPaymentHistory(id),
    getSubscriptionPlans(),
    getSubscriptionStatus(id),
    prisma.verificationRequest.findFirst({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  const totalListings =
    listingGroups.destacadas.length +
    listingGroups.activas.length +
    listingGroups.reservadas.length +
    listingGroups.inactivas.length +
    listingGroups.vendidas.length;

  const usuariosPermissions = getModulePermissions(session.user.adminRole, "usuarios");
  const suscripcionesPermissions = getModulePermissions(session.user.adminRole, "suscripciones");
  const hasActiveSubscription = subscriptionStatus.active;
  // Misma fórmula que `loadActivationContext()` (server/data/listings.ts) —
  // se recalcula acá en vez de llamarla para no repetir la query de User,
  // que ya se cargó completa en `getUserForAdmin`.
  const availablePublications = Math.max(
    0,
    FREE_PUBLICATION_QUOTA +
      user.purchasedPublications +
      (hasActiveSubscription ? user.subscriptionQuota : 0) -
      user.quotaConsumed
  );
  const locked = isAccountLocked(user.lockedUntil);
  const suspended = isUserSuspended(user.suspendedUntil);

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/admin/usuarios" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-navy">{user.fullName}</h1>
        {user.deletedAt ? (
          <Badge variant="danger">Eliminado</Badge>
        ) : user.isActive ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="danger">Baneado</Badge>
        )}
        {user.isVerified && <Badge variant="info">Identidad validada</Badge>}
        {suspended && <Badge variant="danger">Suspendido</Badge>}
        {user.adminRole && <Badge variant="info">{user.adminRole}</Badge>}
      </div>
      <p className="mt-1 text-muted-foreground">{user.email}</p>
      {suspended && (
        <p className="mt-1 text-sm text-danger">
          Suspendido hasta el {dateTimeFormatter.format(user.suspendedUntil!)}
          {user.suspensionReason && <> — Motivo: {user.suspensionReason}</>}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 pt-5 text-sm">
            <p><span className="text-muted-foreground">Tipo de cuenta:</span> {accountTypeLabel(user.accountType)}</p>
            <p><span className="text-muted-foreground">DNI:</span> {user.dni}</p>
            <p><span className="text-muted-foreground">Teléfono:</span> {user.phone}</p>
            <p><span className="text-muted-foreground">Alta:</span> {dateFormatter.format(user.createdAt)}</p>
            <p><span className="text-muted-foreground">Último login:</span> {user.lastLoginAt ? dateFormatter.format(user.lastLoginAt) : "—"}</p>
            {user.agencyProfile && (
              <p><span className="text-muted-foreground">Razón social:</span> {user.agencyProfile.businessName} ({user.agencyProfile.cuit})</p>
            )}
            <p>
              <span className="text-muted-foreground">Verificación de identidad:</span>{" "}
              {verification ? (
                <>
                  {verification.status === "PENDING" && <Badge variant="info">Pendiente</Badge>}
                  {verification.status === "APPROVED" && <Badge variant="success">Aprobada</Badge>}
                  {verification.status === "REJECTED" && <Badge variant="danger">Rechazada</Badge>}
                  {verification.status === "PENDING" && (
                    <Link href="/admin/identidad" className="ml-2 text-primary hover:underline">Revisar</Link>
                  )}
                </>
              ) : (
                "Sin solicitud"
              )}
            </p>
            {(user.adminRole || locked || user.failedLoginAttempts > 0) && (
              <p>
                <span className="text-muted-foreground">Inicio de sesión:</span>{" "}
                {locked ? (
                  <Badge variant="danger">Bloqueado hasta {dateTimeFormatter.format(user.lockedUntil!)}</Badge>
                ) : (
                  <span>{user.failedLoginAttempts} intento{user.failedLoginAttempts === 1 ? "" : "s"} fallido{user.failedLoginAttempts === 1 ? "" : "s"} recientes</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-5 text-sm">
            <p>
              <span className="text-muted-foreground">Suscripción:</span>{" "}
              {hasActiveSubscription
                ? `${subscriptionStatus.planName ?? "Plan no identificado"} — vence ${dateFormatter.format(user.subscriptionExpiresAt!)}`
                : "Sin suscripción activa"}
            </p>
            <p><span className="text-muted-foreground">Publicaciones compradas:</span> {user.purchasedPublications}</p>
            <p><span className="text-muted-foreground">Publicaciones realizadas:</span> {user.activationCount}</p>
            <p className="text-base">
              <span className="text-muted-foreground">Publicaciones disponibles:</span>{" "}
              <span className="font-bold text-primary">{availablePublications}</span>
            </p>
            <p><span className="text-muted-foreground">Vouchers de destacado compradas:</span> {user.featuredVouchersGranted}</p>
            <p><span className="text-muted-foreground">Vouchers de destacado utilizados:</span> {user.featuredVouchersUsed}</p>
            <p><span className="text-muted-foreground">Vouchers de destacado disponibles:</span> {user.pendingFeaturedVouchers}</p>
            <p><span className="text-muted-foreground">Publicaciones totales:</span> {totalListings}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <h2 className="mb-3 text-sm font-bold text-navy">Cuenta</h2>
            <UserAccountActions
              userId={user.id}
              isActive={user.isActive}
              deletedAt={user.deletedAt}
              currentAdminRole={user.adminRole}
              isLocked={locked}
              isSuspended={suspended}
              isSuperAdmin={session.user.adminRole === "SUPERADMIN"}
              isSelf={session.user.id === user.id}
              permissions={usuariosPermissions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h2 className="mb-3 text-sm font-bold text-navy">Suscripción y cupo</h2>
            <UserSubscriptionActions
              userId={user.id}
              hasActiveSubscription={hasActiveSubscription}
              plans={subscriptionPlans.map((p) => ({ code: p.code, name: p.name }))}
              canEdit={suscripcionesPermissions.canEdit}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-navy">Publicaciones ({totalListings})</h2>
        {totalListings === 0 ? (
          <p className="text-sm text-muted-foreground">No tiene publicaciones.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <tbody>
                {[...listingGroups.destacadas, ...listingGroups.activas, ...listingGroups.reservadas, ...listingGroups.inactivas, ...listingGroups.vendidas].map((listing) => (
                  <tr key={listing.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <Link href={`/admin/publicaciones/${listing.id}`} className="text-navy hover:underline">{listing.title}</Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{listing.status}</td>
                    <td className="px-4 py-2">{formatCurrency(listing.price, listing.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-navy">Pagos ({payments.length})</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{payment.description}</td>
                    <td className="px-4 py-2">{formatCurrency(Number(payment.amount), payment.currency)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={PAYMENT_STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{payment.provider}</td>
                    <td className="px-4 py-2 text-muted-foreground">{dateFormatter.format(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

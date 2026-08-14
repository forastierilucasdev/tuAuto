import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { getListingForAdminDetail, isListingSuspended } from "@/server/data/admin/listings";
import { listAuditLog } from "@/server/data/admin/audit-log";
import { getAvailablePublications } from "@/server/data/listings";
import { ListingEditForm } from "@/components/admin/ListingEditForm";
import { ListingStatusActions } from "@/components/admin/ListingStatusActions";
import { AuditChangesModal } from "@/components/admin/AuditChangesModal";
import { ACTION_LABEL } from "@/lib/admin-audit-labels";

export const metadata: Metadata = { title: "Detalle de publicación | Admin" };

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AdminListingDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("publicaciones", "read");
  const permissions = getModulePermissions(session.user.adminRole, "publicaciones");
  const { id } = await props.params;

  const listing = await getListingForAdminDetail(id);
  if (!listing) notFound();
  const suspended = isListingSuspended(listing.suspendedUntil);

  const [ownerAvailablePublications, { entries: auditEntries }] = await Promise.all([
    getAvailablePublications(listing.user.id),
    listAuditLog({ targetTable: "Listing", targetId: id }, 1),
  ]);

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/admin/publicaciones" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-navy">{listing.title}</h1>
        <Badge variant="default">{listing.status}</Badge>
        {suspended && <Badge variant="danger">Suspendida</Badge>}
        {listing.deletedAt && <Badge variant="danger">Dada de baja</Badge>}
      </div>
      <p className="mt-1 text-muted-foreground">
        Dueño:{" "}
        <Link href={`/admin/usuarios/${listing.user.id}`} className="text-primary hover:underline">
          {listing.user.fullName} ({listing.user.email})
        </Link>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">ID: {listing.id}</p>
      {suspended && (
        <p className="mt-1 text-sm text-danger">
          Suspendida hasta el {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(listing.suspendedUntil!)}
          {listing.suspensionReason && <> — Motivo: {listing.suspensionReason}</>}
        </p>
      )}

      {listing.images.length > 0 && (
        <div className="mt-4 flex gap-3 overflow-x-auto">
          {listing.images.map((image) => (
            <div key={image.id} className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
              <Image src={image.url} alt={listing.title} fill sizes="128px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-navy">Estado</h2>
        <ListingStatusActions
          listingId={listing.id}
          deletedAt={listing.deletedAt}
          isSuspended={suspended}
          ownerAvailablePublications={ownerAvailablePublications}
          canEdit={permissions.canEdit}
          canDelete={permissions.canDelete}
        />
      </div>

      <div className="mt-6 max-w-xl">
        <h2 className="mb-3 text-sm font-bold text-navy">Datos de la publicación</h2>
        <ListingEditForm listingId={listing.id} disabled={!permissions.canEdit} listing={listing} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-navy">Historial de auditoría de esta publicación</h2>
        {auditEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay acciones registradas sobre esta publicación.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((entry) => {
                  const changes = entry.changes as { before?: Record<string, unknown>; after?: Record<string, unknown> } | null;
                  return (
                    <tr key={entry.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{entry.admin.fullName}</p>
                        <p className="text-xs text-muted-foreground">{entry.admin.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground">{ACTION_LABEL[entry.action] ?? entry.action}</p>
                        <p className="font-mono text-xs text-muted-foreground">{entry.action}</p>
                      </td>
                      <td className="px-4 py-3">
                        <AuditChangesModal before={changes?.before ?? null} after={changes?.after ?? null} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{dateTimeFormatter.format(entry.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

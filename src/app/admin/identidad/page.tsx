import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { listVerificationRequestsForAdmin } from "@/server/data/admin/verifications";
import { VerificationRowActions } from "@/components/admin/VerificationRowActions";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Identidad | Admin" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function AdminIdentidadPage() {
  const session = await requireAdminPermission("identidad", "read");
  const permissions = getModulePermissions(session.user.adminRole, "identidad");

  const { requests, total } = await listVerificationRequestsForAdmin("PENDING");

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Identidad</h1>
      <p className="mt-1 text-muted-foreground">
        {total} solicitud{total === 1 ? "" : "es"} pendiente{total === 1 ? "" : "s"} de revisión.
        {!permissions.canEdit && " Solo un Superadministrador puede aprobar o dejar una observación."}
      </p>

      {requests.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No hay solicitudes pendientes.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/admin/usuarios/${request.userId}`} className="font-medium text-navy hover:underline">
                    {request.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {request.user.email} · DNI {request.dni} · Tel. {request.phone} · {dateFormatter.format(request.createdAt)}
                  </p>
                  {request.user.isVerified && <Badge variant="success" className="mt-1">Ya verificado</Badge>}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-muted">
                  {request.dniFrontUrl && <Image src={request.dniFrontUrl} alt="DNI frente" fill sizes="240px" className="object-contain" />}
                </div>
                <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-muted">
                  {request.dniBackUrl && <Image src={request.dniBackUrl} alt="DNI dorso" fill sizes="240px" className="object-contain" />}
                </div>
              </div>
              <div className="mt-3 max-w-md">
                <VerificationRowActions requestId={request.id} existingNote={request.adminNote} canEdit={permissions.canEdit} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

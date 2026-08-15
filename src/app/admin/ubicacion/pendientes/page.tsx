import type { Metadata } from "next";
import { BackButton } from "@/components/ui/BackButton";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { listLocalityRequests } from "@/server/data/admin/locality-requests";
import { LocalityRequestRowActions } from "@/components/admin/LocalityRequestRowActions";

export const metadata: Metadata = { title: "Localidades pendientes | Admin" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function AdminLocalityRequestsPage() {
  const session = await requireAdminPermission("ubicacion", "read");
  const permissions = getModulePermissions(session.user.adminRole, "ubicacion");

  const requests = await listLocalityRequests("PENDING");

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/admin/ubicacion" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Localidades pendientes</h1>
      <p className="mt-1 text-muted-foreground">
        {requests.length} solicitud{requests.length === 1 ? "" : "es"} pendiente{requests.length === 1 ? "" : "s"} —
        localidades que un usuario tecleó a mano al publicar porque no las encontró en el catálogo.
        {!permissions.canEdit && " Solo un rol con permiso de edición puede aprobar o dejar una observación."}
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
                  <p className="font-medium text-navy">
                    {request.province.name} · {request.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Pedido el {dateFormatter.format(request.createdAt)}</p>
                  <p className="mt-1 text-xs font-medium text-foreground">
                    {request._count.listings} publicación{request._count.listings === 1 ? "" : "es"} vinculada
                    {request._count.listings === 1 ? "" : "s"} a esta solicitud
                  </p>
                </div>
              </div>
              <div className="mt-3 max-w-md">
                <LocalityRequestRowActions
                  requestId={request.id}
                  name={request.name}
                  existingNote={request.adminNote}
                  canEdit={permissions.canEdit}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { listTaxonomyRequests } from "@/server/data/admin/taxonomy-requests";
import { TaxonomyRequestRowActions } from "@/components/admin/TaxonomyRequestRowActions";

export const metadata: Metadata = { title: "Vehículos pendientes | Admin" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function AdminTaxonomyRequestsPage() {
  const session = await requireAdminPermission("vehiculos", "read");
  const permissions = getModulePermissions(session.user.adminRole, "vehiculos");

  const requests = await listTaxonomyRequests("PENDING");

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/admin/vehiculos" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Vehículos pendientes</h1>
      <p className="mt-1 text-muted-foreground">
        {requests.length} solicitud{requests.length === 1 ? "" : "es"} pendiente{requests.length === 1 ? "" : "s"} —
        vehículos que un usuario tecleó a mano al publicar porque no los encontró en el catálogo.
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
                    {request.vehicleType.label} · {request.brandName} {request.modelName} {request.versionName} (
                    {request.year})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {request.brand ? `Marca "${request.brand.name}" ya existe, falta modelo/versión · ` : ""}
                    Pedido el {dateFormatter.format(request.createdAt)}
                  </p>
                  <Link
                    href={`/admin/publicaciones?q=${encodeURIComponent(request.brandName)}`}
                    className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    {request._count.listings} publicación{request._count.listings === 1 ? "" : "es"} vinculada
                    {request._count.listings === 1 ? "" : "s"} a esta solicitud
                  </Link>
                </div>
              </div>
              <div className="mt-3 max-w-md">
                <TaxonomyRequestRowActions
                  requestId={request.id}
                  brandName={request.brandName}
                  modelName={request.modelName}
                  versionName={request.versionName}
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

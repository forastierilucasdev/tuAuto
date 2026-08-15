import type { Metadata } from "next";
import Link from "next/link";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { listProvincesForAdmin } from "@/server/data/admin/locations";
import { listLocalityRequests } from "@/server/data/admin/locality-requests";
import { Badge } from "@/components/ui/Badge";
import { ProvinceFormModal } from "@/components/admin/ProvinceFormModal";
import { SeedProvincesButton } from "@/components/admin/SeedProvincesButton";
import { EntityActiveToggle } from "@/components/admin/EntityActiveToggle";
import { toggleProvinceActiveAction } from "@/server/actions/admin/locations.actions";

export const metadata: Metadata = { title: "Ubicación | Admin" };

export default async function AdminUbicacionPage() {
  const session = await requireAdminPermission("ubicacion", "read");
  const permissions = getModulePermissions(session.user.adminRole, "ubicacion");

  const [provinces, pendingRequests] = await Promise.all([listProvincesForAdmin(), listLocalityRequests("PENDING")]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy">Ubicación</h1>
          <p className="mt-1 text-muted-foreground">
            Provincias y localidades del catálogo. El wizard de publicar todavía usa la lista fija de provincias —
            cargá primero las provincias registradas para poder administrar sus localidades.
          </p>
        </div>
        <Link
          href="/admin/ubicacion/pendientes"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-navy hover:bg-surface-muted"
        >
          Tareas pendientes
          {pendingRequests.length > 0 && <Badge variant="danger">{pendingRequests.length}</Badge>}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <SeedProvincesButton canEdit={permissions.canEdit} />
        <ProvinceFormModal mode="create" canEdit={permissions.canEdit} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Provincia</th>
              <th className="px-4 py-3">Localidades</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {provinces.map((province) => (
              <tr key={province.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-navy">
                  <Link href={`/admin/ubicacion/${province.id}`} className="hover:underline">
                    {province.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{province._count.localities}</td>
                <td className="px-4 py-3">
                  {province.isActive ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">De baja</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/ubicacion/${province.id}`} className="text-sm font-medium text-primary hover:underline">
                      Ver localidades
                    </Link>
                    <ProvinceFormModal mode="edit" province={province} canEdit={permissions.canEdit} />
                    <EntityActiveToggle
                      isActive={province.isActive}
                      canEdit={permissions.canEdit}
                      offMessage="La provincia deja de ofrecerse como opción nueva en el wizard/filtros. Las publicaciones que ya la usan no se ven afectadas."
                      onMessage="La provincia vuelve a estar disponible."
                      onToggle={(next) => toggleProvinceActiveAction(province.id, next)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {provinces.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Todavía no hay provincias cargadas — usá &quot;Cargar provincias registradas&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

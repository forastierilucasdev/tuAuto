import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { getProvinceById, listLocalitiesForProvince } from "@/server/data/admin/locations";
import { LocalityFormModal } from "@/components/admin/LocalityFormModal";
import { LocalityBulkImportModal } from "@/components/admin/LocalityBulkImportModal";
import { EntityActiveToggle } from "@/components/admin/EntityActiveToggle";
import { toggleLocalityActiveAction } from "@/server/actions/admin/locations.actions";

export const metadata: Metadata = { title: "Localidades | Admin" };

export default async function AdminProvinceDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("ubicacion", "read");
  const permissions = getModulePermissions(session.user.adminRole, "ubicacion");
  const { id } = await props.params;

  const province = await getProvinceById(id);
  if (!province) notFound();
  const localities = await listLocalitiesForProvince(id);

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/admin/ubicacion" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-navy">{province.name}</h1>
        {province.isActive ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">De baja</Badge>}
      </div>
      <p className="mt-1 text-muted-foreground">Localidades de esta provincia.</p>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <LocalityBulkImportModal provinceId={province.id} canEdit={permissions.canEdit} />
        <LocalityFormModal mode="create" provinceId={province.id} canEdit={permissions.canEdit} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Localidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {localities.map((locality) => (
              <tr key={locality.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-navy">{locality.name}</td>
                <td className="px-4 py-3">
                  {locality.isActive ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">De baja</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <LocalityFormModal mode="edit" locality={locality} canEdit={permissions.canEdit} />
                    <EntityActiveToggle
                      isActive={locality.isActive}
                      canEdit={permissions.canEdit}
                      offMessage="La localidad deja de ofrecerse como opción nueva en el wizard/filtros. Las publicaciones que ya la usan no se ven afectadas."
                      onMessage="La localidad vuelve a estar disponible."
                      onToggle={toggleLocalityActiveAction.bind(null, locality.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {localities.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Todavía no hay localidades cargadas para esta provincia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

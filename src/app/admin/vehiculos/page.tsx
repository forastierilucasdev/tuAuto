import type { Metadata } from "next";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { listVehicleTypesForAdmin } from "@/server/data/admin/vehicle-types";
import { Badge } from "@/components/ui/Badge";
import { VehicleTypeFormModal } from "@/components/admin/VehicleTypeFormModal";
import { VehicleTypeActiveToggle } from "@/components/admin/VehicleTypeActiveToggle";
import { vehicleTypeIconFromName } from "@/lib/constants";

export const metadata: Metadata = { title: "Vehículos | Admin" };

export default async function AdminVehiculosPage() {
  const session = await requireAdminPermission("vehiculos", "read");
  const permissions = getModulePermissions(session.user.adminRole, "vehiculos");
  const types = await listVehicleTypesForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Vehículos</h1>
      <p className="mt-1 text-muted-foreground">
        Tipos de vehículo del catálogo. Marcas, modelos y versiones se agregan en una fase siguiente. Esta
        tabla todavía no está conectada a las publicaciones — se conecta en la próxima ronda.
      </p>

      <div className="mt-6 flex justify-end">
        <VehicleTypeFormModal mode="create" canEdit={permissions.canEdit} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Reglas</th>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {types.map((type) => {
              const Icon = vehicleTypeIconFromName(type.icon);
              return (
                <tr key={type.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-navy">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.labelPlural}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{type.code}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {type.mileageUnit === "KM" ? "Kilómetros" : type.mileageUnit === "HORAS" ? "Horas de uso" : "Sin unidad"}
                    {type.usesTransmission && " · Transmisión"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{type.sortOrder}</td>
                  <td className="px-4 py-3">
                    {type.isActive ? <Badge variant="success">Activo</Badge> : <Badge variant="danger">De baja</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <VehicleTypeFormModal mode="edit" vehicleType={type} canEdit={permissions.canEdit} />
                      <VehicleTypeActiveToggle id={type.id} isActive={type.isActive} canEdit={permissions.canEdit} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {types.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No hay tipos de vehículo cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

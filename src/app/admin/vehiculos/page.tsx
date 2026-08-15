import type { Metadata } from "next";
import Link from "next/link";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { listVehicleTypesForAdmin } from "@/server/data/admin/vehicle-types";
import { listBrandsForAdmin, listModelsForAdmin, listVersionsForAdmin } from "@/server/data/admin/vehicles";
import { listTaxonomyRequests } from "@/server/data/admin/taxonomy-requests";
import { Badge } from "@/components/ui/Badge";
import { VehicleTypeFormModal } from "@/components/admin/VehicleTypeFormModal";
import { VehicleTypeActiveToggle } from "@/components/admin/VehicleTypeActiveToggle";
import { BrandFormModal } from "@/components/admin/BrandFormModal";
import { ModelFormModal } from "@/components/admin/ModelFormModal";
import { VersionFormModal } from "@/components/admin/VersionFormModal";
import { EntityActiveToggle } from "@/components/admin/EntityActiveToggle";
import { toggleBrandActiveAction, toggleModelActiveAction, toggleVersionActiveAction } from "@/server/actions/admin/vehicles.actions";
import { vehicleTypeIconFromName } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vehículos | Admin" };

const TABS = [
  { key: "tipos", label: "Tipos" },
  { key: "marcas", label: "Marcas" },
  { key: "modelos", label: "Modelos" },
  { key: "versiones", label: "Versiones" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminVehiculosPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdminPermission("vehiculos", "read");
  const permissions = getModulePermissions(session.user.adminRole, "vehiculos");
  const sp = await props.searchParams;
  const tab = (TABS.some((t) => t.key === param(sp, "tab")) ? param(sp, "tab") : "tipos") as TabKey;

  const [types, brands, models, versions, pendingRequests] = await Promise.all([
    listVehicleTypesForAdmin(),
    listBrandsForAdmin(),
    listModelsForAdmin(),
    listVersionsForAdmin(),
    listTaxonomyRequests("PENDING"),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy">Vehículos</h1>
          <p className="mt-1 text-muted-foreground">
            Tipos, marcas, modelos y versiones del catálogo. El wizard de publicar todavía usa la lista fija de
            tipos — solo Marcas/Modelos/Versiones ya impactan directo en el sitio.
          </p>
        </div>
        <Link
          href="/admin/vehiculos/pendientes"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-navy hover:bg-surface-muted"
        >
          Tareas pendientes
          {pendingRequests.length > 0 && <Badge variant="danger">{pendingRequests.length}</Badge>}
        </Link>
      </div>

      <div className="mt-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/vehiculos?tab=${t.key}`}
            replace
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "tipos" && (
        <div className="mt-4">
          <div className="flex justify-end">
            <VehicleTypeFormModal mode="create" canEdit={permissions.canEdit} />
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Reglas</th>
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "marcas" && (
        <div className="mt-4">
          <div className="flex justify-end">
            <BrandFormModal mode="create" canEdit={permissions.canEdit} />
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-navy">{brand.name}</td>
                    <td className="px-4 py-3">
                      {brand.isActive ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">De baja</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <BrandFormModal mode="edit" brand={brand} canEdit={permissions.canEdit} />
                        <EntityActiveToggle
                          isActive={brand.isActive}
                          canEdit={permissions.canEdit}
                          offMessage="La marca deja de ofrecerse como opción nueva en el wizard/filtros. Las publicaciones que ya la usan no se ven afectadas."
                          onMessage="La marca vuelve a estar disponible."
                          onToggle={(next) => toggleBrandActiveAction(brand.id, next)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {brands.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No hay marcas cargadas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "modelos" && (
        <div className="mt-4">
          <div className="flex justify-end">
            <ModelFormModal
              mode="create"
              canEdit={permissions.canEdit}
              brands={brands.map((b) => ({ id: b.id, name: b.name }))}
              vehicleTypes={types.map((t) => ({ id: t.id, label: t.label }))}
            />
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Modelo</th>
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-navy">{model.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{model.brand.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{model.vehicleType.label}</td>
                    <td className="px-4 py-3">
                      {model.isActive ? <Badge variant="success">Activo</Badge> : <Badge variant="danger">De baja</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <ModelFormModal
                          mode="edit"
                          model={model}
                          canEdit={permissions.canEdit}
                          brands={brands.map((b) => ({ id: b.id, name: b.name }))}
                          vehicleTypes={types.map((t) => ({ id: t.id, label: t.label }))}
                        />
                        <EntityActiveToggle
                          isActive={model.isActive}
                          canEdit={permissions.canEdit}
                          offMessage="El modelo deja de ofrecerse como opción nueva en el wizard/filtros. Las publicaciones que ya lo usan no se ven afectadas."
                          onMessage="El modelo vuelve a estar disponible."
                          onToggle={(next) => toggleModelActiveAction(model.id, next)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {models.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay modelos cargados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "versiones" && (
        <div className="mt-4">
          <div className="flex justify-end">
            <VersionFormModal
              mode="create"
              canEdit={permissions.canEdit}
              brands={brands.map((b) => ({ id: b.id, name: b.name }))}
              models={models.map((m) => ({ id: m.id, name: m.name, brandId: m.brandId }))}
            />
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Versión</th>
                  <th className="px-4 py-3">Modelo</th>
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-navy">{version.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{version.model.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{version.model.brand.name}</td>
                    <td className="px-4 py-3">
                      {version.isActive ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">De baja</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <VersionFormModal
                          mode="edit"
                          version={version}
                          canEdit={permissions.canEdit}
                          brands={brands.map((b) => ({ id: b.id, name: b.name }))}
                          models={models.map((m) => ({ id: m.id, name: m.name, brandId: m.brandId }))}
                        />
                        <EntityActiveToggle
                          isActive={version.isActive}
                          canEdit={permissions.canEdit}
                          offMessage="La versión deja de ofrecerse como opción nueva en el wizard. Las publicaciones que ya la usan no se ven afectadas."
                          onMessage="La versión vuelve a estar disponible."
                          onToggle={(next) => toggleVersionActiveAction(version.id, next)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {versions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay versiones cargadas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

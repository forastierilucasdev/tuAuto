import type { Metadata } from "next";
import Link from "next/link";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { getEffectiveFeatured } from "@/server/data/listings";
import { listFeaturedListingsForAdmin } from "@/server/data/admin/listings";
import { daysRemaining } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { FeaturedRowActions } from "@/components/admin/FeaturedRowActions";

export const metadata: Metadata = { title: "Destacados | Admin" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

/** `<input type="date">` da "YYYY-MM-DD" en hora local — sumar 1 día a "hasta" (exclusivo) para incluir el día entero, igual que hace el filtro de auditoría. */
function endOfDay(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d;
}

export default async function AdminDestacadosPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPermission("destacados", "read");
  const permissions = getModulePermissions(session.user.adminRole, "destacados");
  const sp = await props.searchParams;
  const page = Number(param(sp, "pagina")) || 1;
  const userSearch = param(sp, "usuario");
  const desde = param(sp, "desde");
  const hasta = param(sp, "hasta");

  const { listings, total, totalPages } = await listFeaturedListingsForAdmin(
    {
      userSearch,
      createdFrom: desde ? new Date(`${desde}T00:00:00`) : undefined,
      createdTo: hasta ? endOfDay(hasta) : undefined,
    },
    page
  );

  const params = new URLSearchParams();
  if (userSearch) params.set("usuario", userSearch);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Destacados</h1>
      <p className="mt-1 text-muted-foreground">{total} publicaci{total === 1 ? "ón destacada" : "ones destacadas"} (vigentes o recientes)</p>

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="usuario">Usuario</Label>
          <Input id="usuario" name="usuario" defaultValue={userSearch} placeholder="Email o nombre del dueño" />
        </div>
        <div>
          <Label htmlFor="desde">Fecha de alta — desde</Label>
          <Input id="desde" name="desde" type="date" defaultValue={desde} />
        </div>
        <div>
          <Label htmlFor="hasta">Fecha de alta — hasta</Label>
          <Input id="hasta" name="hasta" type="date" defaultValue={hasta} />
        </div>
        <Button type="submit" size="sm">Filtrar</Button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Publicación</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Desde — Hasta</th>
              <th className="px-4 py-3">Días pendientes</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              const isCurrentlyFeatured = getEffectiveFeatured(listing.featured, listing.featuredUntil);
              const remaining = isCurrentlyFeatured ? daysRemaining(listing.featuredUntil) : 0;
              return (
                <tr key={listing.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/admin/publicaciones/${listing.id}`} className="font-medium text-navy hover:underline">
                      {listing.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/usuarios/${listing.user.id}`} className="text-navy hover:underline">
                      {listing.user.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {isCurrentlyFeatured ? <Badge variant="featured">Destacado</Badge> : <Badge variant="default">Vencido</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {listing.featuredSince ? dateFormatter.format(listing.featuredSince) : "—"}
                    {" — "}
                    {listing.featuredUntil ? dateFormatter.format(listing.featuredUntil) : "Sin vencimiento"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {isCurrentlyFeatured ? `${remaining} día${remaining === 1 ? "" : "s"}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <FeaturedRowActions listingId={listing.id} isCurrentlyFeatured={isCurrentlyFeatured} canEdit={permissions.canEdit} />
                  </td>
                </tr>
              );
            })}
            {listings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No hay publicaciones destacadas que coincidan con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} baseHref="/admin/destacados" params={params} />
    </div>
  );
}

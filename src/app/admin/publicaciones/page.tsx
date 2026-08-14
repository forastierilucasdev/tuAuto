import type { Metadata } from "next";
import Link from "next/link";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { listListingsForAdmin } from "@/server/data/admin/listings";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button, buttonVariants } from "@/components/ui/Button";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListingRowActions } from "@/components/admin/ListingRowActions";
import { cn, formatCurrency } from "@/lib/utils";
import type { ListingStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Publicaciones | Admin" };

const STATUS_LABEL: Record<ListingStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  RESERVADA: "Reservada",
  PAUSADA: "Pausada",
  EXPIRED: "Vencida",
  SOLD: "Vendida",
};

const STATUS_VARIANT: Record<ListingStatus, "success" | "info" | "default" | "danger"> = {
  DRAFT: "default",
  ACTIVE: "success",
  RESERVADA: "info",
  PAUSADA: "default",
  EXPIRED: "danger",
  SOLD: "default",
};

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPublicacionesPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPermission("publicaciones", "read");
  const permissions = getModulePermissions(session.user.adminRole, "publicaciones");
  const sp = await props.searchParams;

  const search = param(sp, "q");
  const status = param(sp, "estado") as ListingStatus | undefined;
  const showDeleted = param(sp, "eliminadas") === "1";
  const page = Number(param(sp, "pagina")) || 1;

  const { listings, total, totalPages } = await listListingsForAdmin({ search, status, showDeleted }, page);

  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (status) params.set("estado", status);
  if (showDeleted) params.set("eliminadas", "1");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy">Publicaciones</h1>
          <p className="mt-1 text-muted-foreground">{total} publicaci{total === 1 ? "ón" : "ones"}</p>
        </div>
        <a href={`/admin/publicaciones/export?${params.toString()}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Exportar CSV
        </a>
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="q">Buscar</label>
          <Input id="q" name="q" defaultValue={search} placeholder="Título, slug o email del dueño" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="estado">Estado</label>
          <Select id="estado" name="estado" defaultValue={status ?? ""}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="eliminadas" value="1" defaultChecked={showDeleted} />
          Mostrar dadas de baja
        </label>
        <Button type="submit" size="sm">Filtrar</Button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Publicación</th>
              <th className="px-4 py-3">Dueño</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                <td className="px-4 py-3">
                  <Link href={`/admin/publicaciones/${listing.id}`} className="font-medium text-navy hover:underline">
                    {listing.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{listing.user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[listing.status]}>{STATUS_LABEL[listing.status]}</Badge>
                  {listing.deletedAt && <Badge variant="danger" className="ml-1.5">Dada de baja</Badge>}
                </td>
                <td className="px-4 py-3">{formatCurrency(Number(listing.price), listing.currency)}</td>
                <td className="px-4 py-3">
                  <ListingRowActions listingId={listing.id} deletedAt={listing.deletedAt} canDelete={permissions.canDelete} />
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay publicaciones que coincidan con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} baseHref="/admin/publicaciones" params={params} />
    </div>
  );
}

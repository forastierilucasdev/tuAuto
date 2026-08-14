import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { listUsersForAdmin } from "@/server/data/admin/users";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button, buttonVariants } from "@/components/ui/Button";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { accountTypeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Usuarios | Admin" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsuariosPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPermission("usuarios", "read");
  const sp = await props.searchParams;

  const search = param(sp, "q");
  const accountType = param(sp, "tipo") as AccountType | undefined;
  const showDeleted = param(sp, "eliminados") === "1";
  const page = Number(param(sp, "pagina")) || 1;

  const { users, total, totalPages } = await listUsersForAdmin({ search, accountType, showDeleted }, page);

  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (accountType) params.set("tipo", accountType);
  if (showDeleted) params.set("eliminados", "1");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy">Usuarios</h1>
          <p className="mt-1 text-muted-foreground">{total} cuenta{total === 1 ? "" : "s"}</p>
        </div>
        <a href={`/admin/usuarios/export?${params.toString()}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Exportar CSV
        </a>
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="q">Buscar</label>
          <Input id="q" name="q" defaultValue={search} placeholder="Email, nombre o DNI" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="tipo">Tipo de cuenta</label>
          <Select id="tipo" name="tipo" defaultValue={accountType ?? ""}>
            <option value="">Todos</option>
            <option value="PARTICULAR">Particular</option>
            <option value="AGENCIA">Agencia</option>
            <option value="CONCESIONARIA">Concesionaria</option>
          </Select>
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="eliminados" value="1" defaultChecked={showDeleted} />
          Mostrar eliminados
        </label>
        <Button type="submit" size="sm">Filtrar</Button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Rol admin</th>
              <th className="px-4 py-3">Alta</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                <td className="px-4 py-3">
                  <Link href={`/admin/usuarios/${user.id}`} className="font-medium text-navy hover:underline">
                    {user.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="px-4 py-3">{accountTypeLabel(user.accountType)}</td>
                <td className="px-4 py-3">
                  {user.deletedAt ? (
                    <Badge variant="danger">Eliminado</Badge>
                  ) : user.isActive ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="danger">Baneado</Badge>
                  )}
                  {user.isVerified && <Badge variant="info" className="ml-1.5">Verificado</Badge>}
                </td>
                <td className="px-4 py-3">{user.adminRole ? <Badge variant="info">{user.adminRole}</Badge> : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{dateFormatter.format(user.createdAt)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay usuarios que coincidan con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} baseHref="/admin/usuarios" params={params} />
    </div>
  );
}

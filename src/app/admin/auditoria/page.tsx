import type { Metadata } from "next";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { listAuditLog } from "@/server/data/admin/audit-log";
import { AdminPagination } from "@/components/admin/AdminPagination";

export const metadata: Metadata = { title: "Auditoría | Admin" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAuditoriaPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPermission("auditoria", "read");
  const sp = await props.searchParams;
  const page = Number(param(sp, "pagina")) || 1;

  const { entries, total, totalPages } = await listAuditLog({}, page);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Auditoría</h1>
      <p className="mt-1 text-muted-foreground">{total} acci{total === 1 ? "ón registrada" : "ones registradas"}</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Objeto</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{entry.admin.fullName}</p>
                  <p className="text-xs text-muted-foreground">{entry.admin.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{entry.action}</td>
                <td className="px-4 py-3 text-muted-foreground">{entry.targetTable} · {entry.targetId}</td>
                <td className="px-4 py-3 text-muted-foreground">{entry.ip ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{dateFormatter.format(entry.createdAt)}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Todavía no hay acciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} baseHref="/admin/auditoria" params={new URLSearchParams()} />
    </div>
  );
}

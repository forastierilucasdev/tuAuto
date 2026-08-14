import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { listAuditLog, resolveAuditTargets, type AdminAuditTargetTable } from "@/server/data/admin/audit-log";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AuditChangesModal } from "@/components/admin/AuditChangesModal";
import { ACTION_LABEL, TARGET_TABLE_LABEL, TARGET_TABLES } from "@/lib/admin-audit-labels";

export const metadata: Metadata = { title: "Auditoría | Admin" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

function endOfDay(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d;
}

export default async function AdminAuditoriaPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPermission("auditoria", "read");
  const sp = await props.searchParams;
  const page = Number(param(sp, "pagina")) || 1;
  const adminSearch = param(sp, "admin");
  const targetTable = param(sp, "objeto") as AdminAuditTargetTable | undefined;
  const desde = param(sp, "desde");
  const hasta = param(sp, "hasta");

  const { entries, total, totalPages } = await listAuditLog(
    {
      adminSearch,
      targetTable,
      from: desde ? new Date(`${desde}T00:00:00`) : undefined,
      to: hasta ? endOfDay(hasta) : undefined,
    },
    page
  );

  const targets = await resolveAuditTargets(
    entries.map((e) => ({ targetTable: e.targetTable as AdminAuditTargetTable, targetId: e.targetId }))
  );

  const params = new URLSearchParams();
  if (adminSearch) params.set("admin", adminSearch);
  if (targetTable) params.set("objeto", targetTable);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Auditoría</h1>
      <p className="mt-1 text-muted-foreground">{total} acci{total === 1 ? "ón registrada" : "ones registradas"}</p>

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="admin">Admin</Label>
          <Input id="admin" name="admin" defaultValue={adminSearch} placeholder="Email o nombre" />
        </div>
        <div>
          <Label htmlFor="objeto">Objeto</Label>
          <Select id="objeto" name="objeto" defaultValue={targetTable ?? ""}>
            <option value="">Todos</option>
            {TARGET_TABLES.map((value) => (
              <option key={value} value={value}>{TARGET_TABLE_LABEL[value]}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" name="desde" type="date" defaultValue={desde} />
        </div>
        <div>
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" name="hasta" type="date" defaultValue={hasta} />
        </div>
        <Button type="submit" size="sm">Filtrar</Button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Objeto</th>
              <th className="px-4 py-3">Detalle</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const target = targets.get(`${entry.targetTable}:${entry.targetId}`);
              const changes = entry.changes as { before?: Record<string, unknown>; after?: Record<string, unknown> } | null;
              return (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{entry.admin.fullName}</p>
                    <p className="text-xs text-muted-foreground">{entry.admin.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground">{ACTION_LABEL[entry.action] ?? entry.action}</p>
                    <p className="font-mono text-xs text-muted-foreground">{entry.action}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {target ? (
                      target.href ? (
                        <Link href={target.href} className="text-primary hover:underline">{target.label}</Link>
                      ) : (
                        target.label
                      )
                    ) : (
                      `${TARGET_TABLE_LABEL[entry.targetTable as AdminAuditTargetTable] ?? entry.targetTable} · ${entry.targetId}`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AuditChangesModal before={changes?.before ?? null} after={changes?.after ?? null} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.ip ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dateFormatter.format(entry.createdAt)}</td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No hay acciones que coincidan con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} baseHref="/admin/auditoria" params={params} />
    </div>
  );
}

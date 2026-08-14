import type { Metadata } from "next";
import Link from "next/link";
import { getModulePermissions, requireAdminPermission } from "@/lib/admin-permissions";
import { listPaymentsForAdmin, listPlansForAdmin } from "@/server/data/admin/subscriptions";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button, buttonVariants } from "@/components/ui/Button";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { PlanActiveToggle } from "@/components/admin/PlanActiveToggle";
import { cn, formatCurrency } from "@/lib/utils";
import type { PaymentStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Suscripciones y Pagos | Admin" };

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, "success" | "info" | "danger"> = {
  APPROVED: "success",
  PENDING: "info",
  REJECTED: "danger",
};

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSuscripcionesPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPermission("suscripciones", "read");
  const permissions = getModulePermissions(session.user.adminRole, "suscripciones");
  const sp = await props.searchParams;

  const search = param(sp, "q");
  const status = param(sp, "estado") as PaymentStatus | undefined;
  const page = Number(param(sp, "pagina")) || 1;

  const [{ payments, total, totalPages }, plans] = await Promise.all([
    listPaymentsForAdmin({ search, status }, page),
    listPlansForAdmin(),
  ]);

  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (status) params.set("estado", status);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Suscripciones y Pagos</h1>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-navy">Planes</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.code} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.code}</p>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(Number(plan.price))}</td>
                  <td className="px-4 py-3">
                    {plan.isActive ? <Badge variant="success">Activo</Badge> : <Badge variant="danger">De baja</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <PlanActiveToggle planCode={plan.code} isActive={plan.isActive} canEdit={permissions.canEdit} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-navy">Pagos ({total})</h2>
          <a href={`/admin/suscripciones/export?${params.toString()}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Exportar CSV
          </a>
        </div>

        <form className="mb-4 mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="q">Buscar</label>
            <Input id="q" name="q" defaultValue={search} placeholder="Email o nombre del usuario" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="estado">Estado</label>
            <Select id="estado" name="estado" defaultValue={status ?? ""}>
              <option value="">Todos</option>
              <option value="APPROVED">Aprobado</option>
              <option value="PENDING">Pendiente</option>
              <option value="REJECTED">Rechazado</option>
            </Select>
          </div>
          <Button type="submit" size="sm">Filtrar</Button>
        </form>

        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/admin/usuarios/${payment.user.id}`} className="text-navy hover:underline">
                      {payment.user.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{payment.description}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(payment.amount), payment.currency)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={PAYMENT_STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{payment.provider}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dateFormatter.format(payment.createdAt)}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No hay pagos que coincidan con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination page={page} totalPages={totalPages} baseHref="/admin/suscripciones" params={params} />
      </div>
    </div>
  );
}

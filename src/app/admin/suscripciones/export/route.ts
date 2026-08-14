import { requireAdminPermission } from "@/lib/admin-permissions";
import { listAllPaymentsForAdmin } from "@/server/data/admin/subscriptions";
import { buildCsv, csvResponse } from "@/lib/csv";
import { formatCurrency } from "@/lib/utils";
import type { PaymentStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  await requireAdminPermission("suscripciones", "read");
  const { searchParams } = new URL(request.url);

  const payments = await listAllPaymentsForAdmin({
    search: searchParams.get("q") ?? undefined,
    status: (searchParams.get("estado") as PaymentStatus) || undefined,
  });

  const csv = buildCsv(
    ["Usuario", "Email", "Descripción", "Plan", "Monto", "Estado", "Proveedor", "Fecha"],
    payments.map((p) => [
      p.user.fullName,
      p.user.email,
      p.description,
      p.planCode,
      formatCurrency(Number(p.amount), p.currency),
      p.status,
      p.provider,
      p.createdAt,
    ])
  );

  return csvResponse(`pagos-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

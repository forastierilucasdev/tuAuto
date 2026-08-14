import { requireAdminPermission } from "@/lib/admin-permissions";
import { listAllUsersForAdmin } from "@/server/data/admin/users";
import { buildCsv, csvResponse } from "@/lib/csv";
import { accountTypeLabel } from "@/lib/constants";
import type { AccountType } from "@/generated/prisma/client";

/** Mismos filtros que `/admin/usuarios`, pero sin paginar — exporta todo lo que coincide con la búsqueda/filtros actuales. */
export async function GET(request: Request) {
  await requireAdminPermission("usuarios", "read");
  const { searchParams } = new URL(request.url);

  const users = await listAllUsersForAdmin({
    search: searchParams.get("q") ?? undefined,
    accountType: (searchParams.get("tipo") as AccountType) || undefined,
    showDeleted: searchParams.get("eliminados") === "1",
  });

  const csv = buildCsv(
    ["Nombre", "Email", "DNI", "Teléfono", "Tipo de cuenta", "Activo", "Verificado", "Rol admin", "Eliminado", "Alta"],
    users.map((u) => [
      u.fullName,
      u.email,
      u.dni,
      u.phone,
      accountTypeLabel(u.accountType),
      u.isActive ? "Sí" : "No",
      u.isVerified ? "Sí" : "No",
      u.adminRole ?? "",
      u.deletedAt ? "Sí" : "No",
      u.createdAt,
    ])
  );

  return csvResponse(`usuarios-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

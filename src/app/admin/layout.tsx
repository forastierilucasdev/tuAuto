import { requireAdmin } from "@/lib/admin-permissions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";

// Guardia de layout: sesión + algún rol de admin (ver `requireAdmin`). El
// guard real de cada mutación es `requireAdminPermission` dentro de cada
// Server Action — este layout es una comodidad de ruteo/UX, no la barrera
// de seguridad (alguien podría postear directo a una action sin pasar por
// acá). Segmento plano `admin` (no grupo de rutas): separa claramente del
// panel del vendedor, `(dashboard)`.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-full flex-col bg-surface-muted">
      <AdminHeader adminRole={session.user.adminRole} />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminSidebarNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

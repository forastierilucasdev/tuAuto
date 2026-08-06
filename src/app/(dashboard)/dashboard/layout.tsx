import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { SITE_NAME } from "@/lib/constants";
import { DashboardSidebarNav } from "@/components/dashboard/DashboardNav";
import { AccountMenu } from "@/components/layout/AccountMenu";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-col bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-extrabold tracking-tight text-navy">
              {SITE_NAME}
            </Link>
            {/* En mobile es el único acceso a Mi perfil / Mis publicaciones /
                Método de pago (la barra horizontal se sacó por ser redundante
                con este menú). En desktop convive con DashboardSidebarNav,
                que también tiene el suyo — no molesta tenerlo dos veces. */}
            <div className="md:hidden">
              <AccountMenu />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session?.user?.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="text-sm font-medium text-primary hover:underline">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <DashboardSidebarNav />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

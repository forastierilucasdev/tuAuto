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
        {/* Mobile: [avatar] [logo centrado] [cerrar sesión]. Desktop: el
            avatar ya está en DashboardSidebarNav, así que acá solo va el
            logo a la izquierda y la sesión a la derecha. */}
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden text-lg font-extrabold tracking-tight text-navy md:block">
              {SITE_NAME}
            </Link>
            <div className="md:hidden">
              <AccountMenu />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Link href="/" className="text-lg font-extrabold tracking-tight text-navy md:hidden">
              {SITE_NAME}
            </Link>
          </div>

          <div className="flex items-center justify-end gap-4">
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

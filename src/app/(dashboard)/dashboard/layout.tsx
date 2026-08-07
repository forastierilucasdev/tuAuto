import { DashboardSidebarNav } from "@/components/dashboard/DashboardNav";
import { Header } from "@/components/layout/Header";

// Mismo header que el resto del sitio (nav, "Publicar anuncio", "Bienvenido,
// {nombre}" + ícono de cuenta en desktop, menú hamburguesa con "Mi cuenta" y
// "Cerrar sesión" en mobile) — antes el dashboard tenía uno propio, más
// simple, que quedaba visualmente inconsistente con las pantallas públicas.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-surface-muted">
      <Header />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <DashboardSidebarNav />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

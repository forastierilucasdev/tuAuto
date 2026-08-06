import { redirect } from "next/navigation";

// "/dashboard" (raíz) ya no tiene pantalla propia — el equivalente a lo que
// antes era "Resumen" es "Mi perfil", accesible desde el AccountMenu en
// todos lados. Si alguien llega acá directo (link viejo, historial), lo
// mandamos ahí en vez de mostrar una pantalla en desuso.
export default function DashboardRootPage() {
  redirect("/dashboard/perfil");
}

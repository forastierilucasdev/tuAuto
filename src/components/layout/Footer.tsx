import Link from "next/link";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-xl font-extrabold tracking-tight">{SITE_NAME}</p>
          <p className="mt-2 max-w-xs text-sm text-white/70">
            Catálogo de compra y venta de autos, camionetas, motos, bicicletas, monopatines,
            lanchas y barcos.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white/90">Navegación</p>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-white/90">Vendedores</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/login" className="text-sm text-white/70 hover:text-white">
                Vende tu auto
              </Link>
            </li>
            <li>
              <Link href="/registro" className="text-sm text-white/70 hover:text-white">
                Crear cuenta
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {SITE_NAME}. Todos los derechos reservados.
      </div>
    </footer>
  );
}

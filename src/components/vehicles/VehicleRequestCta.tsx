import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** CTA reutilizable de "avisame cuando publiquen algo así" — mismo destino que el bloque del inicio (`/buscar-vehiculo`), en formato compacto para usar debajo de los filtros del catálogo o cuando una búsqueda no da resultados. */
export function VehicleRequestCta() {
  return (
    <div className="rounded-2xl bg-navy p-6 text-center text-white">
      <h3 className="text-base font-bold">¿Buscás un auto en especial?</h3>
      <p className="mt-1 text-sm text-white/70">
        Dejanos tus datos de contacto y te avisaremos apenas se publique.
      </p>
      <Link
        href="/buscar-vehiculo"
        className={cn(buttonVariants({ variant: "primary", size: "sm" }), "mt-4")}
      >
        Contactarme
      </Link>
    </div>
  );
}

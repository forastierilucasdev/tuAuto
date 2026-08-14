import type { Metadata } from "next";
import { BackButton } from "@/components/ui/BackButton";
import { SupportForm } from "@/components/forms/SupportForm";

export const metadata: Metadata = { title: "Soporte" };

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function SoportePage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const defaultListingId = param(sp, "listingId");

  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Soporte</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        ¿Encontraste un error? Contanos qué pasó y, si podés, adjuntá una captura — lo vamos a revisar a
        la brevedad. Si el error es sobre una publicación puntual, decinos su ID (lo encontrás en la tarjeta,
        dentro de &quot;Mis publicaciones&quot;) para poder identificarla con seguridad.
      </p>
      <SupportForm defaultListingId={defaultListingId} />
    </div>
  );
}

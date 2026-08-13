import type { Metadata } from "next";
import { BackButton } from "@/components/ui/BackButton";
import { SupportForm } from "@/components/forms/SupportForm";

export const metadata: Metadata = { title: "Soporte" };

export default function SoportePage() {
  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Soporte</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        ¿Encontraste un error? Contanos qué pasó y, si podés, adjuntá una captura — lo vamos a revisar a
        la brevedad.
      </p>
      <SupportForm />
    </div>
  );
}

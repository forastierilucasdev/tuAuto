import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Creá tu cuenta</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Elegí el tipo de cuenta para empezar a publicar tus vehículos.
      </p>
      <RegisterForm />
    </div>
  );
}

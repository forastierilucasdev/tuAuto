import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Vende tu Auto</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Ingresá con tu cuenta para publicar y gestionar tus anuncios.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

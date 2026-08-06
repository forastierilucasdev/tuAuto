import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm";

export const metadata: Metadata = { title: "Cambiar contraseña" };

export default function ChangePasswordPage() {
  return (
    <div>
      <Link
        href="/dashboard/perfil"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mi perfil
      </Link>
      <h1 className="text-2xl font-bold text-navy">Cambiar contraseña</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Ingresá tu contraseña actual y la nueva.</p>
      <ChangePasswordForm />
    </div>
  );
}

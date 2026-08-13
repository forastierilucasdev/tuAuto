import type { Metadata } from "next";
import { BackButton } from "@/components/ui/BackButton";
import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm";

export const metadata: Metadata = { title: "Cambiar contraseña" };

export default function ChangePasswordPage() {
  return (
    <div>
      <div className="flex justify-end">
        <BackButton href="/dashboard/perfil" />
      </div>
      <h1 className="mt-2 text-2xl font-bold text-navy">Cambiar contraseña</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Ingresá tu contraseña actual y la nueva.</p>
      <ChangePasswordForm />
    </div>
  );
}

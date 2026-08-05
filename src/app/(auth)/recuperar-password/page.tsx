import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Recuperar contraseña</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Ingresá el email de tu cuenta y te enviamos instrucciones para restablecer tu contraseña.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}

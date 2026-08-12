import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Resultado del pago" };

const ESTADOS = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-success",
    title: "¡Gracias por tu compra!",
    message:
      "Estamos confirmando el pago con Mercado Pago — en unos segundos vas a ver el cupo o el destacado reflejado en tu cuenta.",
  },
  pending: {
    icon: Clock,
    iconClass: "text-warning",
    title: "Tu pago quedó pendiente",
    message:
      "Mercado Pago todavía está procesando el pago (algunos medios, como transferencias o efectivo, tardan más). Te avisamos apenas se confirme — podés revisar el estado en Historial de pagos.",
  },
  failure: {
    icon: XCircle,
    iconClass: "text-danger",
    title: "El pago no se pudo procesar",
    message: "Mercado Pago rechazó el pago. No se te cobró nada ni se acreditó ningún beneficio — podés intentarlo de nuevo.",
  },
} as const;

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResultadoPagoPage(props: PageProps<"/dashboard/compra/resultado">) {
  const sp = await props.searchParams;
  const estado = param(sp, "estado");
  const info = estado === "success" || estado === "pending" || estado === "failure" ? ESTADOS[estado] : ESTADOS.pending;
  const Icon = info.icon;

  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <Icon className={cn("mx-auto h-14 w-14", info.iconClass)} />
      <h1 className="mt-4 text-2xl font-bold text-navy">{info.title}</h1>
      <p className="mt-2 text-muted-foreground">{info.message}</p>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/dashboard/compra" className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
          Volver a Mis compras
        </Link>
        <Link href="/dashboard/compra/historial" className={cn(buttonVariants({ variant: "primary" }), "w-full sm:w-auto")}>
          Ver historial de pagos
        </Link>
      </div>
    </div>
  );
}

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        // Acción principal de una pantalla (una sola por vista, salvo los
        // trillizos de diálogo de abajo).
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-navy text-white hover:bg-navy/90",
        // Relleno verde + letra blanca: acción positiva directa (ej.
        // "Publicar" en un diálogo de "Sí, editar / Publicar / Cancelar").
        // Mismo lenguaje visual (verde/azul/rojo, siempre rellenos, nunca
        // solo texto) en toda la app — cambiar acá alcanza para todos lados.
        success: "bg-success text-white hover:bg-success/90",
        // Sin color asignado: siempre necesita borde visible para no
        // desaparecer sobre fondo blanco (border-border es deliberadamente
        // más oscuro que el borde decorativo de las Card).
        outline: "border-2 border-slate-300 bg-transparent text-foreground hover:bg-surface-muted hover:border-slate-400",
        // Reservado para casos puntuales sin acción de decisión (ej. un
        // ícono suelto) — evitar en botones de confirmar/cancelar.
        ghost: "bg-transparent text-foreground hover:bg-surface-muted",
        // Relleno rojo + letra blanca: "Cancelar" en diálogos de decisión, y
        // cualquier acción que borra datos de verdad (ej. "Sí, eliminar").
        destructive: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

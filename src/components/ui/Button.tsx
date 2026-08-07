import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-navy text-white hover:bg-navy/90",
        outline: "border border-border bg-transparent text-foreground hover:bg-surface-muted",
        ghost: "bg-transparent text-foreground hover:bg-surface-muted",
        destructive: "bg-danger text-white hover:bg-danger/90",
        // Trío semántico con borde visible, para diálogos de confirmación
        // con más de una acción positiva (ej. "Sí, editar" / "No, publicar"
        // / "Cancelar"): mismo lenguaje visual en toda la app, un solo lugar
        // para ajustar el color si hace falta más adelante.
        "outline-primary": "border border-primary bg-transparent text-primary hover:bg-primary/10",
        "outline-success": "border border-success bg-transparent text-success hover:bg-success/10",
        "outline-danger": "border border-danger bg-transparent text-danger hover:bg-danger/10",
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

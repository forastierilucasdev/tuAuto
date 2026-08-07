import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          // Padding derecho un poco mayor que el izquierdo, a propósito: le
          // deja lugar a la flechita sin que el texto largo quede tapado
          // detrás (con padding realmente simétrico, un valor como "Todos
          // los vendedores" terminaba recortado antes de tiempo).
          "h-10 w-full appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-border bg-surface pl-3 pr-8 text-sm text-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
);
Select.displayName = "Select";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-surface-muted text-foreground",
      primary: "bg-primary/10 text-primary",
      featured: "bg-featured text-featured-ink",
      success: "bg-green-100 text-green-800",
      danger: "bg-red-100 text-red-800",
      info: "bg-sky-100 text-sky-800",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {variant === "featured" && <Star className="h-3 w-3 fill-current" />}
      {children}
    </span>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const [open, setOpen] = React.useState(false);

  const ctaHref = isAuthed ? "/dashboard" : "/login";
  const ctaLabel = isAuthed ? "Mi cuenta" : "Vende tu Auto";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight text-navy sm:text-xl">
          {SITE_NAME}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-surface-muted hover:text-foreground",
                  active && "text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href={ctaHref} className={buttonVariants({ variant: "primary", size: "md" })}>
            {ctaLabel}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link href={ctaHref} className={buttonVariants({ variant: "primary", size: "sm" })}>
            {ctaLabel}
          </Link>
          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

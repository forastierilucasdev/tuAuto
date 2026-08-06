"use client";

import * as React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const VISIBLE_DURATION_MS = 20_000;

/**
 * Botón flotante "Publicar anuncio" (mobile, logueado). Aparece al
 * scrollear, se mantiene 20 segundos y desaparece solo si la pantalla queda
 * quieta (sin scroll) ese tiempo — en vez de quedar fijo siempre abajo.
 */
export function FloatingPublishButton({ href }: { href: string }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    function handleScroll() {
      setVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setVisible(false), VISIBLE_DURATION_MS);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-4 z-40 flex justify-center transition-all duration-300 md:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <Link href={href} className={cn(buttonVariants({ variant: "primary", size: "md" }), "shadow-card-hover")}>
        Publicar anuncio
      </Link>
    </div>
  );
}

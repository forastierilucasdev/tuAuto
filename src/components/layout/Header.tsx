"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/Button";
import { AccountMenu, type AccountMenuHandle } from "@/components/layout/AccountMenu";
import { FloatingPublishButton } from "@/components/layout/FloatingPublishButton";
import { cn } from "@/lib/utils";

const PUBLISH_HREF = "/dashboard/publicaciones/nueva";

export function Header() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const [open, setOpen] = React.useState(false);
  const accountMenuRef = React.useRef<AccountMenuHandle>(null);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        {/* 3 columnas para poder centrar el logo en mobile de forma robusta,
            sin importar el ancho de los elementos a los costados: en mobile
            es [avatar] [logo] [hamburguesa]; en desktop, [logo] [nav]
            [Publicar anuncio + avatar, éste último pegado del todo a la
            derecha — su panel abre desde ese mismo borde]. */}
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/" className="hidden h-9 md:block">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG: next/image bloquea SVG salvo dangerouslyAllowSVG, y un vector no gana nada de la optimización */}
              <img src="/logo.svg" alt={SITE_NAME} className="h-full w-auto object-contain" />
            </Link>
            <div className="md:hidden">
              <AccountMenu ref={accountMenuRef} />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Link href="/" className="h-8 md:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- ver comentario arriba */}
              <img src="/logo.svg" alt={SITE_NAME} className="h-full w-auto object-contain" />
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
              {!isAuthed && (
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  Ingresar
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center justify-end gap-2">
            {isAuthed ? (
              <Link
                href={PUBLISH_HREF}
                className={cn(buttonVariants({ variant: "primary", size: "md" }), "hidden md:inline-flex")}
              >
                Publicar anuncio
              </Link>
            ) : (
              <Link href="/login" className={buttonVariants({ variant: "primary", size: "sm" })}>
                Vende tu Auto
              </Link>
            )}

            <div className="hidden md:block">
              <AccountMenu showGreeting panelSide="right" />
            </div>

            <button
              type="button"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground md:hidden"
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
              {!isAuthed && (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-surface-muted"
                >
                  Iniciar sesión
                </Link>
              )}
              {isAuthed && (
                <>
                  <hr className="my-2 border-border" />
                  {/* Negrita más marcada que el resto del menú (font-bold +
                      texto sin atenuar) para que se destaquen como accesos
                      a la cuenta, no como otro link de navegación más. */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      accountMenuRef.current?.open();
                    }}
                    className="rounded-md px-3 py-2 text-left text-sm font-bold text-foreground hover:bg-surface-muted"
                  >
                    Mi cuenta
                  </button>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-md px-3 py-2 text-left text-sm font-bold text-danger hover:bg-danger/10"
                  >
                    Cerrar sesión
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile, logueado: en vez de un botón fijo debajo del header, flota
          abajo de la pantalla y aparece al scrollear (ver FloatingPublishButton). */}
      {isAuthed && <FloatingPublishButton href={PUBLISH_HREF} />}
    </>
  );
}

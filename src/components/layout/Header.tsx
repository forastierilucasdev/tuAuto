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
        {/* 3 columnas para centrar la del medio (logo en mobile, nav en
            desktop) de verdad, sin importar el ancho de los costados: en
            mobile es [avatar] [logo] [hamburguesa]; en desktop, [logo] [nav]
            [Publicar anuncio + avatar, éste último pegado del todo a la
            derecha — su panel abre desde ese mismo borde]. Los costados son
            "1fr" (mismo ancho entre sí, cada uno absorbe la mitad del
            espacio sobrante) y el medio es "auto" (el tamaño de su propio
            contenido) — así el medio queda centrado de verdad aunque los
            costados tengan contenido de ancho distinto (con "auto 1fr auto"
            el nav quedaba corrido hacia la izquierda al iniciar sesión,
            porque "Publicar anuncio" + avatar pesan más que el logo solo). */}
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/" className="hidden items-center rounded-md p-1.5 md:flex">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG: next/image bloquea SVG salvo dangerouslyAllowSVG, y un vector no gana nada de la optimización.
                  Altura fija directo en el <img> (no en un wrapper con h-full): el preflight de Tailwind pone "height: auto" en <img>, y con h-full en un
                  contenedor sin ancho propio terminaba usando el tamaño intrínseco del SVG en vez de achicarse — se veía enorme. Altura fluida (clamp): crece o
                  se achica con el ancho de la ventana en vez de saltar entre 2-3 tamaños fijos por breakpoint. El padding del Link le da un margen de aire
                  respecto al borde del header en los 4 lados. */}
              <img src="/logo-v2.svg" alt={SITE_NAME} className="h-[clamp(1.75rem,3vw,2.25rem)] w-auto" />
            </Link>
            <div className="md:hidden">
              <AccountMenu ref={accountMenuRef} />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Link href="/" className="flex items-center rounded-md p-1.5 md:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- ver comentario arriba */}
              <img src="/logo-v2.svg" alt={SITE_NAME} className="h-[clamp(1.5rem,6vw,2rem)] w-auto" />
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

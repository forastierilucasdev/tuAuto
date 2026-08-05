"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/lib/constants";

type GalleryImage = { id: string; url: string; alt: string | null };

export function VehicleGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const list: GalleryImage[] =
    images.length > 0 ? images : [{ id: "placeholder", url: FALLBACK_IMAGE, alt: title }];
  const current = list[Math.min(active, list.length - 1)];

  const goPrev = React.useCallback(() => {
    setActive((i) => (i - 1 + list.length) % list.length);
  }, [list.length]);

  const goNext = React.useCallback(() => {
    setActive((i) => (i + 1) % list.length);
  }, [list.length]);

  React.useEffect(() => {
    if (!lightboxOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, goPrev, goNext]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-surface-muted"
      >
        <Image
          src={current.url}
          alt={current.alt ?? title}
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover"
          priority
        />
        <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Expand className="h-4 w-4" />
        </span>
      </button>

      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {list.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                index === active ? "border-primary" : "border-transparent"
              )}
            >
              <Image src={img.url} alt={img.alt ?? title} fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${title}`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative flex h-full max-h-[85vh] w-full max-w-5xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {list.length > 1 && (
              <button
                type="button"
                onClick={goPrev}
                aria-label="Foto anterior"
                className="absolute left-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-2"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div className="relative h-full w-full">
              <Image
                src={current.url}
                alt={current.alt ?? title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {list.length > 1 && (
              <button
                type="button"
                onClick={goNext}
                aria-label="Foto siguiente"
                className="absolute right-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-2"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {list.length > 1 && (
            <p className="absolute bottom-4 text-sm text-white/70">
              {active + 1} / {list.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/lib/constants";

type GalleryImage = { id: string; url: string; alt: string | null };

export function VehicleGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = React.useState(0);
  const list: GalleryImage[] =
    images.length > 0 ? images : [{ id: "placeholder", url: FALLBACK_IMAGE, alt: title }];
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-muted">
        <Image
          src={current.url}
          alt={current.alt ?? title}
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
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
    </div>
  );
}

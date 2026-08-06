"use client";

import * as React from "react";

/** Bloquea el scroll del body mientras `active` es true (paneles/modales). */
export function useBodyScrollLock(active: boolean) {
  React.useEffect(() => {
    if (!active) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);
}

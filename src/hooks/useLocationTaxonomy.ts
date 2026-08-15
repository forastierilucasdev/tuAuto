"use client";

import * as React from "react";
import { getLocalitiesForProvinceAction, getProvincesAction } from "@/server/actions/location.actions";

export type LocationOption = { id: string; name: string; slug: string };

/**
 * Cascada Provincia → Localidad, mismo patrón que `useVehicleTaxonomy` —
 * centraliza el fetch vía Server Actions para no duplicar la lógica de
 * efectos en el wizard y el editor básico de admin.
 */
export function useLocationTaxonomy(provinceSlug: string) {
  const [provinces, setProvinces] = React.useState<LocationOption[]>([]);
  const [localities, setLocalities] = React.useState<LocationOption[]>([]);

  React.useEffect(() => {
    getProvincesAction().then(setProvinces);
  }, []);

  React.useEffect(() => {
    const request = provinceSlug ? getLocalitiesForProvinceAction(provinceSlug) : Promise.resolve([]);
    request.then(setLocalities);
  }, [provinceSlug]);

  return { provinces, localities };
}

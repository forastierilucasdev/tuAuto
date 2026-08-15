"use client";

import * as React from "react";
import {
  getAvailableYearsAction,
  getBrandsForTypeAction,
  getModelsForBrandAction,
  getVersionsForModelAction,
} from "@/server/actions/taxonomy.actions";

export type TaxonomyOption = { id: string; name: string; slug: string };

/**
 * Cascada Tipo → Marca → Modelo → Versión → Año reutilizada por el buscador
 * principal (HeroSearch), los filtros del catálogo (CatalogFilters) y el
 * formulario de publicar (ListingForm). Centraliza el fetch vía Server
 * Actions para no duplicar la misma lógica de efectos en cada lugar.
 * `vehicleType` es el código de `VehicleTypeCatalog` (ej. "AUTO"), no un
 * enum de Prisma — mismo criterio que `brandSlug`/`modelSlug`.
 */
export function useVehicleTaxonomy(
  vehicleType: string,
  brandSlug: string,
  modelSlug: string
) {
  const [brands, setBrands] = React.useState<TaxonomyOption[]>([]);
  const [models, setModels] = React.useState<TaxonomyOption[]>([]);
  const [versions, setVersions] = React.useState<TaxonomyOption[]>([]);
  const [years, setYears] = React.useState<number[]>([]);

  React.useEffect(() => {
    getBrandsForTypeAction(vehicleType || undefined).then(setBrands);
  }, [vehicleType]);

  React.useEffect(() => {
    const request = brandSlug
      ? getModelsForBrandAction(brandSlug, vehicleType || undefined)
      : Promise.resolve([]);
    request.then(setModels);
  }, [brandSlug, vehicleType]);

  React.useEffect(() => {
    const request = modelSlug && brandSlug ? getVersionsForModelAction(modelSlug, brandSlug) : Promise.resolve([]);
    request.then(setVersions);
  }, [modelSlug, brandSlug]);

  React.useEffect(() => {
    getAvailableYearsAction({
      vehicleType: vehicleType || undefined,
      brandSlug: brandSlug || undefined,
      modelSlug: modelSlug || undefined,
    }).then(setYears);
  }, [vehicleType, brandSlug, modelSlug]);

  return { brands, models, versions, years };
}

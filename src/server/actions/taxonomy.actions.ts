"use server";

import { getAvailableYears, getBrandsForType, getModelsForBrand, getVersionsForModel } from "@/server/data/taxonomy";

export async function getBrandsForTypeAction(vehicleType?: string) {
  return getBrandsForType(vehicleType);
}

export async function getModelsForBrandAction(brandSlug: string, vehicleType?: string) {
  return getModelsForBrand(brandSlug, vehicleType);
}

export async function getVersionsForModelAction(modelSlug: string, brandSlug: string) {
  return getVersionsForModel(modelSlug, brandSlug);
}

export async function getAvailableYearsAction(filters: {
  vehicleType?: string;
  brandSlug?: string;
  modelSlug?: string;
}) {
  return getAvailableYears({
    vehicleTypeCode: filters.vehicleType,
    brandSlug: filters.brandSlug,
    modelSlug: filters.modelSlug,
  });
}

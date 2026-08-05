"use server";

import type { VehicleType } from "@/generated/prisma/client";
import { getAvailableYears, getBrandsForType, getModelsForBrand } from "@/server/data/taxonomy";

export async function getBrandsForTypeAction(vehicleType?: VehicleType) {
  return getBrandsForType(vehicleType);
}

export async function getModelsForBrandAction(brandSlug: string, vehicleType?: VehicleType) {
  return getModelsForBrand(brandSlug, vehicleType);
}

export async function getAvailableYearsAction(filters: {
  vehicleType?: VehicleType;
  brandSlug?: string;
  modelSlug?: string;
}) {
  return getAvailableYears(filters);
}

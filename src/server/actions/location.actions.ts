"use server";

import { getLocalitiesForProvince, getProvinces } from "@/server/data/locations";

export async function getProvincesAction() {
  return getProvinces();
}

export async function getLocalitiesForProvinceAction(provinceSlug: string) {
  return getLocalitiesForProvince(provinceSlug);
}

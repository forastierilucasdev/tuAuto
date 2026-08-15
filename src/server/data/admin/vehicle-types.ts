import "server-only";
import { prisma } from "@/lib/prisma";

export async function listVehicleTypesForAdmin() {
  return prisma.vehicleTypeCatalog.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] });
}

export async function getVehicleTypeById(id: string) {
  return prisma.vehicleTypeCatalog.findUnique({ where: { id } });
}

export type VehicleTypeInput = {
  code: string;
  label: string;
  labelPlural: string;
  icon: string;
  mileageUnit: "KM" | "HORAS" | null;
  usesTransmission: boolean;
  sortOrder: number;
};

export async function createVehicleType(data: VehicleTypeInput) {
  return prisma.vehicleTypeCatalog.create({ data });
}

/** `code` nunca se edita acá — es la clave estable que la próxima fase usa para resolver `Model`/`Listing.vehicleTypeId`. */
export async function updateVehicleType(id: string, data: Omit<VehicleTypeInput, "code">) {
  return prisma.vehicleTypeCatalog.update({ where: { id }, data });
}

export async function toggleVehicleTypeActive(id: string, isActive: boolean) {
  return prisma.vehicleTypeCatalog.update({ where: { id }, data: { isActive } });
}

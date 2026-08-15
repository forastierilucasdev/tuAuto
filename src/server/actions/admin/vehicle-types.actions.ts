"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import {
  createVehicleType,
  getVehicleTypeById,
  toggleVehicleTypeActive,
  updateVehicleType,
  type VehicleTypeInput,
} from "@/server/data/admin/vehicle-types";
import { ADMIN_SELECTABLE_ICONS } from "@/lib/constants";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

function validate(input: VehicleTypeInput): string | null {
  if (!input.code.trim() || !/^[A-Z0-9_]+$/.test(input.code.trim())) {
    return "El código debe ser solo mayúsculas, números y guiones bajos (ej: CAMION).";
  }
  if (input.label.trim().length < 2) return "El nombre es obligatorio.";
  if (input.labelPlural.trim().length < 2) return "El nombre en plural es obligatorio.";
  if (!ADMIN_SELECTABLE_ICONS[input.icon]) return "Elegí un ícono válido.";
  if (!Number.isInteger(input.sortOrder)) return "El orden debe ser un número entero.";
  return null;
}

export async function createVehicleTypeAction(input: VehicleTypeInput): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const error = validate(input);
  if (error) return { error };

  const data: VehicleTypeInput = { ...input, code: input.code.trim().toUpperCase() };
  let created;
  try {
    created = await createVehicleType(data);
  } catch {
    return { error: "Ya existe un tipo con ese código." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "vehicleType.create",
    targetTable: "VehicleTypeCatalog",
    targetId: created.id,
    changes: { after: data },
  });

  revalidatePath("/admin/vehiculos");
  return { success: true };
}

export async function updateVehicleTypeAction(
  id: string,
  input: Omit<VehicleTypeInput, "code">
): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const before = await getVehicleTypeById(id);
  if (!before) return { error: "Tipo de vehículo no encontrado." };
  const error = validate({ ...input, code: before.code });
  if (error) return { error };

  await updateVehicleType(id, input);
  await logAdminAction({
    adminId: session.user.id,
    action: "vehicleType.update",
    targetTable: "VehicleTypeCatalog",
    targetId: id,
    changes: {
      before: {
        label: before.label,
        labelPlural: before.labelPlural,
        icon: before.icon,
        mileageUnit: before.mileageUnit,
        usesTransmission: before.usesTransmission,
        sortOrder: before.sortOrder,
      },
      after: input,
    },
  });

  revalidatePath("/admin/vehiculos");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function toggleVehicleTypeActiveAction(id: string, isActive: boolean): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  await toggleVehicleTypeActive(id, isActive);
  await logAdminAction({
    adminId: session.user.id,
    action: "vehicleType.toggleActive",
    targetTable: "VehicleTypeCatalog",
    targetId: id,
    changes: { after: { isActive } },
  });

  revalidatePath("/admin/vehiculos");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import {
  createBrand,
  createModel,
  createVersion,
  getBrandById,
  getModelById,
  getVersionById,
  toggleBrandActive,
  toggleModelActive,
  toggleVersionActive,
  updateBrand,
  updateModel,
  updateVersion,
} from "@/server/data/admin/vehicles";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

function revalidateCatalog() {
  revalidatePath("/admin/vehiculos");
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/buscar-vehiculo");
}

// --- Marcas ---

export async function createBrandAction(input: { name: string; logoUrl: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const name = input.name.trim();
  if (name.length < 2) return { error: "El nombre es obligatorio." };

  let created;
  try {
    created = await createBrand({ name, logoUrl: input.logoUrl.trim() || null });
  } catch {
    return { error: "Ya existe una marca con ese nombre." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "brand.create",
    targetTable: "Brand",
    targetId: created.id,
    changes: { after: { name: created.name, logoUrl: created.logoUrl } },
  });
  revalidateCatalog();
  return { success: true };
}

export async function updateBrandAction(id: string, input: { name: string; logoUrl: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const before = await getBrandById(id);
  if (!before) return { error: "Marca no encontrada." };
  const name = input.name.trim();
  if (name.length < 2) return { error: "El nombre es obligatorio." };

  const after = await updateBrand(id, { name, logoUrl: input.logoUrl.trim() || null });
  await logAdminAction({
    adminId: session.user.id,
    action: "brand.update",
    targetTable: "Brand",
    targetId: id,
    changes: { before: { name: before.name, logoUrl: before.logoUrl }, after: { name: after.name, logoUrl: after.logoUrl } },
  });
  revalidateCatalog();
  return { success: true };
}

export async function toggleBrandActiveAction(id: string, isActive: boolean): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  await toggleBrandActive(id, isActive);
  await logAdminAction({ adminId: session.user.id, action: "brand.toggleActive", targetTable: "Brand", targetId: id, changes: { after: { isActive } } });
  revalidateCatalog();
  return { success: true };
}

// --- Modelos ---

export async function createModelAction(input: { name: string; brandId: string; vehicleTypeId: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const name = input.name.trim();
  if (name.length < 1) return { error: "El nombre es obligatorio." };
  if (!input.brandId) return { error: "Elegí una marca." };
  if (!input.vehicleTypeId) return { error: "Elegí un tipo de vehículo." };

  let created;
  try {
    created = await createModel({ name, brandId: input.brandId, vehicleTypeId: input.vehicleTypeId });
  } catch {
    return { error: "Ya existe ese modelo para esa marca y tipo de vehículo." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "model.create",
    targetTable: "Model",
    targetId: created.id,
    changes: { after: { name: created.name, brandId: created.brandId, vehicleTypeId: created.vehicleTypeId } },
  });
  revalidateCatalog();
  return { success: true };
}

export async function updateModelAction(
  id: string,
  input: { name: string; brandId: string; vehicleTypeId: string }
): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const before = await getModelById(id);
  if (!before) return { error: "Modelo no encontrado." };
  const name = input.name.trim();
  if (name.length < 1) return { error: "El nombre es obligatorio." };
  if (!input.brandId) return { error: "Elegí una marca." };
  if (!input.vehicleTypeId) return { error: "Elegí un tipo de vehículo." };

  let after;
  try {
    after = await updateModel(id, { name, brandId: input.brandId, vehicleTypeId: input.vehicleTypeId });
  } catch {
    return { error: "Ya existe ese modelo para esa marca y tipo de vehículo." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "model.update",
    targetTable: "Model",
    targetId: id,
    changes: {
      before: { name: before.name, brandId: before.brandId, vehicleTypeId: before.vehicleTypeId },
      after: { name: after.name, brandId: after.brandId, vehicleTypeId: after.vehicleTypeId },
    },
  });
  revalidateCatalog();
  return { success: true };
}

export async function toggleModelActiveAction(id: string, isActive: boolean): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  await toggleModelActive(id, isActive);
  await logAdminAction({ adminId: session.user.id, action: "model.toggleActive", targetTable: "Model", targetId: id, changes: { after: { isActive } } });
  revalidateCatalog();
  return { success: true };
}

// --- Versiones ---

export async function createVersionAction(input: { name: string; modelId: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const name = input.name.trim();
  if (name.length < 1) return { error: "El nombre es obligatorio." };
  if (!input.modelId) return { error: "Elegí un modelo." };

  let created;
  try {
    created = await createVersion({ name, modelId: input.modelId });
  } catch {
    return { error: "Ya existe esa versión para ese modelo." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "version.create",
    targetTable: "Version",
    targetId: created.id,
    changes: { after: { name: created.name, modelId: created.modelId } },
  });
  revalidateCatalog();
  return { success: true };
}

export async function updateVersionAction(id: string, input: { name: string; modelId: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  const before = await getVersionById(id);
  if (!before) return { error: "Versión no encontrada." };
  const name = input.name.trim();
  if (name.length < 1) return { error: "El nombre es obligatorio." };
  if (!input.modelId) return { error: "Elegí un modelo." };

  let after;
  try {
    after = await updateVersion(id, { name, modelId: input.modelId });
  } catch {
    return { error: "Ya existe esa versión para ese modelo." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "version.update",
    targetTable: "Version",
    targetId: id,
    changes: { before: { name: before.name, modelId: before.modelId }, after: { name: after.name, modelId: after.modelId } },
  });
  revalidateCatalog();
  return { success: true };
}

export async function toggleVersionActiveAction(id: string, isActive: boolean): Promise<AdminActionState> {
  const session = await requireAdminPermission("vehiculos", "edit");
  await toggleVersionActive(id, isActive);
  await logAdminAction({ adminId: session.user.id, action: "version.toggleActive", targetTable: "Version", targetId: id, changes: { after: { isActive } } });
  revalidateCatalog();
  return { success: true };
}

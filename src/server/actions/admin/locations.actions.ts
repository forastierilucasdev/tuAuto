"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/server/data/admin/audit-log";
import {
  createLocality,
  createLocalitiesBulk,
  createProvince,
  getProvinceById,
  seedProvincesFromConstant,
  toggleLocalityActive,
  toggleProvinceActive,
  updateLocality,
  updateProvince,
} from "@/server/data/admin/locations";

export type AdminActionState = { error?: string; success?: boolean } | undefined;

function revalidateLocations() {
  revalidatePath("/admin/ubicacion");
  revalidatePath("/");
  revalidatePath("/catalogo");
}

// --- Provincias ---

export async function seedProvincesAction(): Promise<AdminActionState> {
  const session = await requireAdminPermission("ubicacion", "edit");
  const { created } = await seedProvincesFromConstant();
  await logAdminAction({
    adminId: session.user.id,
    action: "province.seed",
    targetTable: "Province",
    targetId: "bulk",
    changes: { after: { created } },
  });
  revalidateLocations();
  return { success: true };
}

export async function createProvinceAction(input: { name: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("ubicacion", "edit");
  const name = input.name.trim();
  if (name.length < 2) return { error: "El nombre es obligatorio." };

  let created;
  try {
    created = await createProvince({ name });
  } catch {
    return { error: "Ya existe una provincia con ese nombre." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "province.create",
    targetTable: "Province",
    targetId: created.id,
    changes: { after: { name: created.name } },
  });
  revalidateLocations();
  return { success: true };
}

export async function updateProvinceAction(id: string, input: { name: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("ubicacion", "edit");
  const before = await getProvinceById(id);
  if (!before) return { error: "Provincia no encontrada." };
  const name = input.name.trim();
  if (name.length < 2) return { error: "El nombre es obligatorio." };

  let after;
  try {
    after = await updateProvince(id, { name });
  } catch {
    return { error: "Ya existe una provincia con ese nombre." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "province.update",
    targetTable: "Province",
    targetId: id,
    changes: { before: { name: before.name }, after: { name: after.name } },
  });
  revalidateLocations();
  return { success: true };
}

export async function toggleProvinceActiveAction(id: string, isActive: boolean): Promise<AdminActionState> {
  const session = await requireAdminPermission("ubicacion", "edit");
  await toggleProvinceActive(id, isActive);
  await logAdminAction({
    adminId: session.user.id,
    action: "province.toggleActive",
    targetTable: "Province",
    targetId: id,
    changes: { after: { isActive } },
  });
  revalidateLocations();
  return { success: true };
}

// --- Localidades ---

export async function createLocalityAction(input: { name: string; provinceId: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("ubicacion", "edit");
  const name = input.name.trim();
  if (name.length < 1) return { error: "El nombre es obligatorio." };
  if (!input.provinceId) return { error: "Provincia inválida." };

  let created;
  try {
    created = await createLocality({ name, provinceId: input.provinceId });
  } catch {
    return { error: "Ya existe esa localidad en esa provincia." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "locality.create",
    targetTable: "Locality",
    targetId: created.id,
    changes: { after: { name: created.name, provinceId: created.provinceId } },
  });
  revalidateLocations();
  return { success: true };
}

export async function createLocalitiesBulkAction(
  provinceId: string,
  rawText: string
): Promise<AdminActionState & { created?: number; skipped?: number }> {
  const session = await requireAdminPermission("ubicacion", "edit");
  if (!provinceId) return { error: "Provincia inválida." };

  const names = rawText.split("\n");
  const { created, skipped } = await createLocalitiesBulk(provinceId, names);

  await logAdminAction({
    adminId: session.user.id,
    action: "locality.bulkCreate",
    targetTable: "Province",
    targetId: provinceId,
    changes: { after: { created, skipped } },
  });
  revalidateLocations();
  return { success: true, created, skipped };
}

export async function updateLocalityAction(id: string, input: { name: string }): Promise<AdminActionState> {
  const session = await requireAdminPermission("ubicacion", "edit");
  const name = input.name.trim();
  if (name.length < 1) return { error: "El nombre es obligatorio." };

  let after;
  try {
    after = await updateLocality(id, { name });
  } catch {
    return { error: "Ya existe esa localidad en esa provincia." };
  }

  await logAdminAction({
    adminId: session.user.id,
    action: "locality.update",
    targetTable: "Locality",
    targetId: id,
    changes: { after: { name: after.name } },
  });
  revalidateLocations();
  return { success: true };
}

export async function toggleLocalityActiveAction(id: string, isActive: boolean): Promise<AdminActionState> {
  const session = await requireAdminPermission("ubicacion", "edit");
  await toggleLocalityActive(id, isActive);
  await logAdminAction({
    adminId: session.user.id,
    action: "locality.toggleActive",
    targetTable: "Locality",
    targetId: id,
    changes: { after: { isActive } },
  });
  revalidateLocations();
  return { success: true };
}

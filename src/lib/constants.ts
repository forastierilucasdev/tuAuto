import {
  Bike,
  Car,
  Motorbike,
  Sailboat,
  Scooter,
  Ship,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * Tipos de vehículo soportados por el catálogo. Coincide 1 a 1 con el enum
 * `VehicleType` de prisma/schema.prisma — única fuente de verdad para el
 * dato en sí; este archivo solo agrega metadata de presentación (label, ícono).
 */
export const VEHICLE_TYPES = [
  { value: "AUTO", label: "Auto", icon: Car },
  { value: "CAMIONETA", label: "Camioneta", icon: Truck },
  { value: "MOTO", label: "Moto", icon: Motorbike },
  { value: "BICICLETA", label: "Bicicleta", icon: Bike },
  { value: "MONOPATIN", label: "Monopatín", icon: Scooter },
  { value: "LANCHA", label: "Lancha", icon: Sailboat },
  { value: "BARCO", label: "Barco", icon: Ship },
] as const satisfies ReadonlyArray<{ value: string; label: string; icon: LucideIcon }>;

export type VehicleTypeValue = (typeof VEHICLE_TYPES)[number]["value"];

export function vehicleTypeLabel(value: string) {
  return VEHICLE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function vehicleTypeIcon(value: string): LucideIcon {
  return VEHICLE_TYPES.find((t) => t.value === value)?.icon ?? Car;
}

export const CONDITION_OPTIONS = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "USADO", label: "Usado" },
] as const;

export type ConditionValue = (typeof CONDITION_OPTIONS)[number]["value"];

export function conditionLabel(value: string) {
  return CONDITION_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

export const TRANSMISSION_OPTIONS = [
  { value: "MECANICA", label: "Mecánica" },
  { value: "ASISTIDA", label: "Asistida" },
] as const;

export function transmissionLabel(value: string) {
  return TRANSMISSION_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

/**
 * Tipos de cuenta. Coincide 1 a 1 con el enum `AccountType` de
 * prisma/schema.prisma. AGENCIA y CONCESIONARIA comparten la misma forma de
 * perfil de negocio (razón social, CUIT, ubicación) — solo cambia la etiqueta.
 */
export const ACCOUNT_TYPE_LABELS = {
  PARTICULAR: "Particular",
  AGENCIA: "Agencia",
  CONCESIONARIA: "Concesionaria",
} as const;

export type AccountTypeValue = keyof typeof ACCOUNT_TYPE_LABELS;

export function accountTypeLabel(value: string) {
  return ACCOUNT_TYPE_LABELS[value as AccountTypeValue] ?? value;
}

export function isBusinessAccountType(value: string): value is "AGENCIA" | "CONCESIONARIA" {
  return value === "AGENCIA" || value === "CONCESIONARIA";
}

export const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/concesionarias", label: "Concesionarias" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
] as const;

export const SITE_NAME = "Motoresya";

export const FALLBACK_IMAGE = "https://picsum.photos/seed/tuauto-placeholder/800/600";

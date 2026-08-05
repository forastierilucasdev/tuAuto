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

export const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/concesionarias", label: "Concesionarias" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
] as const;

export const SITE_NAME = "tuAuto";

export const FALLBACK_IMAGE = "https://picsum.photos/seed/tuauto-placeholder/800/600";

import {
  Bike,
  Bus,
  Car,
  HelpCircle,
  Motorbike,
  Sailboat,
  Scooter,
  Ship,
  Tractor,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * Whitelist fijo de íconos seleccionables al crear/editar un tipo de
 * vehículo desde el panel admin — nunca se importa un ícono dinámicamente
 * por string (no hay forma de ejecutar código arbitrario). Si el ícono
 * guardado en la base no está acá (dato corrupto/versión vieja), se cae a
 * `Car`, ver `vehicleTypeIconFromName()`.
 */
export const ADMIN_SELECTABLE_ICONS: Record<string, LucideIcon> = {
  Car,
  Truck,
  Motorbike,
  Bike,
  Scooter,
  Sailboat,
  Ship,
  Bus,
  Tractor,
  HelpCircle,
};

export function vehicleTypeIconFromName(name: string): LucideIcon {
  return ADMIN_SELECTABLE_ICONS[name] ?? Car;
}

/**
 * Tipos de vehículo soportados por el catálogo. Coincide 1 a 1 con el enum
 * `VehicleType` de prisma/schema.prisma — única fuente de verdad para el
 * dato en sí; este archivo solo agrega metadata de presentación (label, ícono).
 */
// `label` (singular) se usa en el wizard de publicar, donde elegís el tipo
// de UN vehículo puntual ("Auto Toyota Corolla 2023"); `labelPlural` en los
// filtros y "Explorá por categoría", donde se navega por categorías de
// varios anuncios ("Autos", "Motos").
export const VEHICLE_TYPES = [
  { value: "AUTO", label: "Auto", labelPlural: "Autos", icon: Car },
  { value: "CAMIONETA", label: "Camioneta", labelPlural: "Camionetas", icon: Truck },
  { value: "MOTO", label: "Moto", labelPlural: "Motos", icon: Motorbike },
  { value: "BICICLETA", label: "Bicicleta", labelPlural: "Bicicletas", icon: Bike },
  { value: "MONOPATIN", label: "Monopatín", labelPlural: "Monopatines", icon: Scooter },
  { value: "LANCHA", label: "Lancha", labelPlural: "Lanchas", icon: Sailboat },
  { value: "BARCO", label: "Barco", labelPlural: "Barcos", icon: Ship },
] as const satisfies ReadonlyArray<{ value: string; label: string; labelPlural: string; icon: LucideIcon }>;

export type VehicleTypeValue = (typeof VEHICLE_TYPES)[number]["value"];

export function vehicleTypeLabel(value: string) {
  return VEHICLE_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Provincias argentinas — lista fija (la localidad la escribe el usuario libremente). */
export const PROVINCIAS = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires (CABA)",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export function vehicleTypeIcon(value: string): LucideIcon {
  return VEHICLE_TYPES.find((t) => t.value === value)?.icon ?? Car;
}

// El wizard, los filtros y las tarjetas de publicación se adaptan según el
// tipo de vehículo: kilometraje solo tiene sentido en autos/camionetas/
// monopatines, "horas de motor" en lanchas/barcos, y motos/bicicletas no
// muestran ninguno de los dos. Única fuente de verdad para esta regla.
const KM_VEHICLE_TYPES: VehicleTypeValue[] = ["AUTO", "CAMIONETA", "MONOPATIN"];
const HOURS_VEHICLE_TYPES: VehicleTypeValue[] = ["LANCHA", "BARCO"];
const TRANSMISSION_VEHICLE_TYPES: VehicleTypeValue[] = ["AUTO", "CAMIONETA"];

/** `"km"` | `"horas"` | `null` (el tipo no usa ninguno de los dos, ej. moto/bicicleta). */
export function mileageUnitFor(vehicleType: string): "km" | "horas" | null {
  if (KM_VEHICLE_TYPES.includes(vehicleType as VehicleTypeValue)) return "km";
  if (HOURS_VEHICLE_TYPES.includes(vehicleType as VehicleTypeValue)) return "horas";
  return null;
}

export function usesTransmission(vehicleType: string): boolean {
  return TRANSMISSION_VEHICLE_TYPES.includes(vehicleType as VehicleTypeValue);
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

/** Opciones para el selector de 3 vías (registro y edición de perfil). */
export const ACCOUNT_TYPE_OPTIONS = (
  Object.entries(ACCOUNT_TYPE_LABELS) as [AccountTypeValue, string][]
).map(([value, label]) => ({ value, label }));

export function accountTypeLabel(value: string) {
  return ACCOUNT_TYPE_LABELS[value as AccountTypeValue] ?? value;
}

export function isBusinessAccountType(value: string): value is "AGENCIA" | "CONCESIONARIA" {
  return value === "AGENCIA" || value === "CONCESIONARIA";
}

export const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/concesionarias", label: "Concesionarias | Agencias" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
] as const;

/** Pestañas de "Mis publicaciones" — única fuente de verdad para la página y el selector mobile (`PublicacionesTabs`). */
export const PUBLICACIONES_TABS = [
  { key: "activas", label: "Activas" },
  { key: "destacadas", label: "Destacadas" },
  { key: "reservadas", label: "Reservadas" },
  { key: "inactivas", label: "Inactivas" },
  { key: "vendidas", label: "Vendidas" },
] as const;

export type PublicacionesTabKey = (typeof PUBLICACIONES_TABS)[number]["key"];

export const SITE_NAME = "Motoresya";

export const FALLBACK_IMAGE = "https://picsum.photos/seed/tuauto-placeholder/800/600";

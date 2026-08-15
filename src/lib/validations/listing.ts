import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();

// El título de la publicación siempre se compone Marca + Modelo + Año en el
// servidor (ver server/data/listings.ts) — nunca es texto libre del usuario.

// El wizard manda el slug de una versión ya cargada en el catálogo (cascada
// Marca→Modelo→Versión), no texto libre — el nombre real (`version`, texto
// histórico en `Listing`) se resuelve server-side a partir de este slug (ver
// `createListing`/`updateOwnedListing` en `server/data/listings.ts`).
const versionSlugSchema = z.string().trim().optional();

// Mismo criterio que `versionSlugSchema`: el wizard manda el slug de una
// Provincia/Localidad ya cargada en el catálogo (cascada), no texto libre —
// se resuelve server-side a partir de este slug (ver
// `resolveLocationPatch` en `server/data/listings.ts`).
const provinceSlugSchema = z.string().trim().optional();
const localitySlugSchema = z.string().trim().optional();

// "Observaciones": no obligatorio, sin longitud mínima.
const descriptionSchema = z.string().trim().max(3000).optional();

const priceSchema = z.coerce.number().positive({ error: "Ingresá un precio válido." });

const currencySchema = z.enum(["ARS", "USD"]);

const conditionSchema = z.enum(["NUEVO", "USADO"]);

const transmissionSchema = z.enum(["MECANICA", "ASISTIDA"]).optional();

const mileageKmSchema = z.coerce.number().int().nonnegative().optional();

const contactAddressSchema = z.string().trim().max(160).optional();

// Los checkbox HTML solo mandan valor cuando están tildados ("on"); si no,
// la clave ni aparece en el FormData.
const checkboxSchema = z.preprocess((value) => value === "on" || value === true, z.boolean());

// Mismos 7 códigos que `VEHICLE_TYPES` en `lib/constants.ts` — el wizard
// todavía ofrece solo esos como opciones (ver ARCHITECTURE.md 7.2.7,
// "Fase 3"), así que un enum fijo acá sigue siendo válido. Si en una fase
// futura el `<select>` de Tipo pasa a leer `VehicleTypeCatalog` completo,
// esto tiene que volverse una validación dinámica contra esa tabla.
export const vehicleTypeSchema = z.enum([
  "AUTO",
  "CAMIONETA",
  "MOTO",
  "BICICLETA",
  "MONOPATIN",
  "LANCHA",
  "BARCO",
]);

// Texto tecleado a mano en el modal "¿Tu vehículo no está en la lista?"
// (wizard) — mutuamente excluyente con `brandSlug`/`modelSlug` (nunca
// ambos, nunca ninguno). El Tipo nunca es "pendiente", siempre se elige de
// la lista fija — solo Marca/Modelo/Versión pueden faltar en el catálogo.
const pendingVehicleTextSchema = z.string().trim().min(1).max(80).optional();

// Mismo criterio para el modal "¿No encontrás tu localidad?" — mutuamente
// excluyente con `localitySlug`, y exige una Provincia real (siempre se
// elige de la lista fija de 24, nunca es texto libre).
const pendingLocalityTextSchema = z.string().trim().min(1).max(80).optional();

export const createListingSchema = z
  .object({
    vehicleType: vehicleTypeSchema,
    brandSlug: z.string().trim().optional(),
    modelSlug: z.string().trim().optional(),
    pendingBrandName: pendingVehicleTextSchema,
    pendingModelName: pendingVehicleTextSchema,
    pendingVersionName: pendingVehicleTextSchema,
    year: z.coerce
      .number()
      .int()
      .min(1950, { error: "Ingresá un año válido." })
      .max(CURRENT_YEAR + 1, { error: "Ingresá un año válido." }),
    versionSlug: versionSlugSchema,
    condition: conditionSchema,
    transmission: transmissionSchema,
    description: descriptionSchema,
    price: priceSchema,
    currency: currencySchema,
    priceNegotiable: checkboxSchema,
    acceptsTrade: checkboxSchema,
    acceptsFinancing: checkboxSchema,
    mileageKm: mileageKmSchema,
    localitySlug: localitySlugSchema,
    provinceSlug: provinceSlugSchema,
    pendingLocalityName: pendingLocalityTextSchema,
    contactAddress: contactAddressSchema,
  })
  .refine((data) => Boolean(data.brandSlug && data.modelSlug) !== Boolean(data.pendingBrandName), {
    error: "Elegí una marca/modelo de la lista, o cargalos a mano desde \"¿Tu vehículo no está en la lista?\".",
    path: ["brandSlug"],
  })
  .refine((data) => !data.pendingBrandName || Boolean(data.pendingModelName && data.pendingVersionName), {
    error: "Completá marca, modelo y versión en el modal de carga manual.",
    path: ["pendingModelName"],
  })
  .refine((data) => !(data.localitySlug && data.pendingLocalityName), {
    error: "Elegí una localidad de la lista, o cargala a mano — no las dos a la vez.",
    path: ["localitySlug"],
  })
  .refine((data) => !data.pendingLocalityName || Boolean(data.provinceSlug), {
    error: "Elegí la provincia antes de cargar una localidad a mano.",
    path: ["provinceSlug"],
  });

export const updateListingSchema = z.object({
  versionSlug: versionSlugSchema,
  condition: conditionSchema,
  transmission: transmissionSchema,
  description: descriptionSchema,
  price: priceSchema,
  currency: currencySchema,
  priceNegotiable: checkboxSchema,
  acceptsTrade: checkboxSchema,
  acceptsFinancing: checkboxSchema,
  mileageKm: mileageKmSchema,
  localitySlug: localitySlugSchema,
  provinceSlug: provinceSlugSchema,
  contactAddress: contactAddressSchema,
});

// Todos los campos son opcionales — el modal de "Marcar vendido" existe
// sobre todo para confirmar antes de cambiar el estado, no para exigir datos.
export const markSoldSchema = z.object({
  soldAt: z.coerce.date().optional(),
  buyerInfo: z.string().trim().max(200).optional(),
  realSalePrice: z.coerce.number().positive().optional(),
  saleConditions: z.string().trim().max(500).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type MarkSoldInput = z.infer<typeof markSoldSchema>;

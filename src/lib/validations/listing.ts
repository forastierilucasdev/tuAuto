import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();

// El título de la publicación siempre se compone Marca + Modelo + Año en el
// servidor (ver server/data/listings.ts) — nunca es texto libre del usuario.

const versionSchema = z.string().trim().max(60).optional();

// "Observaciones": no obligatorio, sin longitud mínima.
const descriptionSchema = z.string().trim().max(3000).optional();

const priceSchema = z.coerce.number().positive({ error: "Ingresá un precio válido." });

const currencySchema = z.enum(["ARS", "USD"]);

const conditionSchema = z.enum(["NUEVO", "USADO"]);

const transmissionSchema = z.enum(["MECANICA", "ASISTIDA"]).optional();

const mileageKmSchema = z.coerce.number().int().nonnegative().optional();

const optionalTextSchema = z.string().trim().max(80).optional();

const contactAddressSchema = z.string().trim().max(160).optional();

// Los checkbox HTML solo mandan valor cuando están tildados ("on"); si no,
// la clave ni aparece en el FormData.
const checkboxSchema = z.preprocess((value) => value === "on" || value === true, z.boolean());

export const vehicleTypeSchema = z.enum([
  "AUTO",
  "CAMIONETA",
  "MOTO",
  "BICICLETA",
  "MONOPATIN",
  "LANCHA",
  "BARCO",
]);

export const createListingSchema = z.object({
  vehicleType: vehicleTypeSchema,
  brandSlug: z.string().min(1, { error: "Elegí una marca." }),
  modelSlug: z.string().min(1, { error: "Elegí un modelo." }),
  year: z.coerce
    .number()
    .int()
    .min(1950, { error: "Ingresá un año válido." })
    .max(CURRENT_YEAR + 1, { error: "Ingresá un año válido." }),
  version: versionSchema,
  condition: conditionSchema,
  transmission: transmissionSchema,
  description: descriptionSchema,
  price: priceSchema,
  currency: currencySchema,
  priceNegotiable: checkboxSchema,
  acceptsTrade: checkboxSchema,
  acceptsFinancing: checkboxSchema,
  mileageKm: mileageKmSchema,
  city: optionalTextSchema,
  province: optionalTextSchema,
  contactAddress: contactAddressSchema,
});

export const updateListingSchema = z.object({
  version: versionSchema,
  condition: conditionSchema,
  transmission: transmissionSchema,
  description: descriptionSchema,
  price: priceSchema,
  currency: currencySchema,
  priceNegotiable: checkboxSchema,
  acceptsTrade: checkboxSchema,
  acceptsFinancing: checkboxSchema,
  mileageKm: mileageKmSchema,
  city: optionalTextSchema,
  province: optionalTextSchema,
  contactAddress: contactAddressSchema,
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

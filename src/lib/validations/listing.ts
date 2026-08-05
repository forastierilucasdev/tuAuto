import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();

const titleSchema = z
  .string()
  .trim()
  .min(5, { error: "El título debe tener al menos 5 caracteres." })
  .max(120);

const descriptionSchema = z
  .string()
  .trim()
  .min(20, { error: "Contanos un poco más sobre el vehículo (mínimo 20 caracteres)." })
  .max(3000);

const priceSchema = z.coerce.number().positive({ error: "Ingresá un precio válido." });

const currencySchema = z.enum(["ARS", "USD"]);

const mileageKmSchema = z.coerce.number().int().nonnegative().optional();

const optionalTextSchema = z.string().trim().max(80).optional();

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
  title: titleSchema,
  description: descriptionSchema,
  price: priceSchema,
  currency: currencySchema,
  mileageKm: mileageKmSchema,
  city: optionalTextSchema,
  province: optionalTextSchema,
});

export const updateListingSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  price: priceSchema,
  currency: currencySchema,
  mileageKm: mileageKmSchema,
  city: optionalTextSchema,
  province: optionalTextSchema,
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

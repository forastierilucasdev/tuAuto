-- CreateTable
CREATE TABLE "VehicleTypeCatalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelPlural" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "mileageUnit" TEXT,
    "usesTransmission" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleTypeCatalog_code_key" ON "VehicleTypeCatalog"("code");

-- Seed: espeja los 7 valores del enum VehicleType — la fase siguiente
-- resuelve Model/Listing.vehicleTypeId por "code" contra estas filas.
-- `id` generado con gen_random_uuid() (extensión pgcrypto, ya disponible en
-- Supabase por defecto) — no hace falta que tenga forma de cuid, Prisma solo
-- exige que sea un string único, y nada depende del formato del id acá.
INSERT INTO "VehicleTypeCatalog" ("id", "code", "label", "labelPlural", "icon", "mileageUnit", "usesTransmission", "isActive", "sortOrder") VALUES
  (gen_random_uuid()::text, 'AUTO', 'Auto', 'Autos', 'Car', 'KM', true, true, 0),
  (gen_random_uuid()::text, 'CAMIONETA', 'Camioneta', 'Camionetas', 'Truck', 'KM', true, true, 1),
  (gen_random_uuid()::text, 'MOTO', 'Moto', 'Motos', 'Motorbike', NULL, false, true, 2),
  (gen_random_uuid()::text, 'BICICLETA', 'Bicicleta', 'Bicicletas', 'Bike', NULL, false, true, 3),
  (gen_random_uuid()::text, 'MONOPATIN', 'Monopatín', 'Monopatines', 'Scooter', 'KM', false, true, 4),
  (gen_random_uuid()::text, 'LANCHA', 'Lancha', 'Lanchas', 'Sailboat', 'HORAS', false, true, 5),
  (gen_random_uuid()::text, 'BARCO', 'Barco', 'Barcos', 'Ship', 'HORAS', false, true, 6);

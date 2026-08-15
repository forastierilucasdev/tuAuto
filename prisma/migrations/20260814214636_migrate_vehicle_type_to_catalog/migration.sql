-- Migra Model.vehicleType / Listing.vehicleType del enum "VehicleType" a una
-- FK real contra VehicleTypeCatalog (ya sembrada 1:1 con los 7 valores del
-- enum en la migración anterior). Backfill 100% determinístico, verificado
-- de antemano contra la base real: 0 filas sin match (60 Model, 38 Listing).

-- Paso 1: columna nueva nullable en las dos tablas
ALTER TABLE "Model" ADD COLUMN "vehicleTypeId" TEXT;
ALTER TABLE "Listing" ADD COLUMN "vehicleTypeId" TEXT;

-- Paso 2: backfill por código (Model.vehicleType::text = VehicleTypeCatalog.code)
UPDATE "Model" m SET "vehicleTypeId" = vtc.id FROM "VehicleTypeCatalog" vtc WHERE vtc.code = m."vehicleType"::text;
UPDATE "Listing" l SET "vehicleTypeId" = vtc.id FROM "VehicleTypeCatalog" vtc WHERE vtc.code = l."vehicleType"::text;

-- Paso 3: ya no puede haber nulos (verificado antes de aplicar) — NOT NULL
ALTER TABLE "Model" ALTER COLUMN "vehicleTypeId" SET NOT NULL;
ALTER TABLE "Listing" ALTER COLUMN "vehicleTypeId" SET NOT NULL;

-- Paso 4: sacar índices/constraints viejos que referencian la columna enum
DROP INDEX "Listing_vehicleType_brandId_modelId_year_idx";
DROP INDEX "Model_brandId_vehicleType_name_key";
DROP INDEX "Model_vehicleType_brandId_idx";

-- Paso 5: sacar las columnas enum viejas
ALTER TABLE "Model" DROP COLUMN "vehicleType";
ALTER TABLE "Listing" DROP COLUMN "vehicleType";

-- Paso 6: el enum ya no lo referencia ninguna columna
DROP TYPE "VehicleType";

-- Paso 7: índices/constraint nuevos sobre vehicleTypeId
CREATE INDEX "Listing_vehicleTypeId_brandId_modelId_year_idx" ON "Listing"("vehicleTypeId", "brandId", "modelId", "year");
CREATE INDEX "Model_vehicleTypeId_brandId_idx" ON "Model"("vehicleTypeId", "brandId");
CREATE UNIQUE INDEX "Model_brandId_vehicleTypeId_name_key" ON "Model"("brandId", "vehicleTypeId", "name");

-- Paso 8: FKs
ALTER TABLE "Model" ADD CONSTRAINT "Model_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleTypeCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleTypeCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('NUEVO', 'USADO');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MECANICA', 'ASISTIDA');

-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'CONCESIONARIA';

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "acceptsFinancing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsTrade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "condition" "VehicleCondition" NOT NULL DEFAULT 'USADO',
ADD COLUMN     "contactAddress" TEXT,
ADD COLUMN     "priceNegotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transmission" "TransmissionType",
ADD COLUMN     "version" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Listing_condition_idx" ON "Listing"("condition");

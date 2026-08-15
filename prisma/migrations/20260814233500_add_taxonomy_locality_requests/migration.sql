-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_brandId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_modelId_fkey";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "pendingBrandName" TEXT,
ADD COLUMN     "pendingLocalityName" TEXT,
ADD COLUMN     "pendingLocalityRequestId" TEXT,
ADD COLUMN     "pendingModelName" TEXT,
ADD COLUMN     "pendingTaxonomyRequestId" TEXT,
ADD COLUMN     "pendingVersionName" TEXT,
ALTER COLUMN "brandId" DROP NOT NULL,
ALTER COLUMN "modelId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TaxonomyRequest" (
    "id" TEXT NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    "brandId" TEXT,
    "brandName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalityRequest" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyRequest_dedupeKey_key" ON "TaxonomyRequest"("dedupeKey");

-- CreateIndex
CREATE INDEX "TaxonomyRequest_status_idx" ON "TaxonomyRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LocalityRequest_dedupeKey_key" ON "LocalityRequest"("dedupeKey");

-- CreateIndex
CREATE INDEX "LocalityRequest_status_idx" ON "LocalityRequest"("status");

-- AddForeignKey
ALTER TABLE "TaxonomyRequest" ADD CONSTRAINT "TaxonomyRequest_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleTypeCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxonomyRequest" ADD CONSTRAINT "TaxonomyRequest_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalityRequest" ADD CONSTRAINT "LocalityRequest_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_pendingTaxonomyRequestId_fkey" FOREIGN KEY ("pendingTaxonomyRequestId") REFERENCES "TaxonomyRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_pendingLocalityRequestId_fkey" FOREIGN KEY ("pendingLocalityRequestId") REFERENCES "LocalityRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

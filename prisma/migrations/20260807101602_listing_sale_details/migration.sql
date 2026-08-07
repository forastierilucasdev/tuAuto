-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "buyerInfo" TEXT,
ADD COLUMN     "realSalePrice" DECIMAL(12,2),
ADD COLUMN     "saleConditions" TEXT;

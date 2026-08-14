-- AlterTable
ALTER TABLE "User" ADD COLUMN     "featuredVouchersGranted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "featuredVouchersUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subscriptionPlanCode" TEXT;

-- Backfill: no hay forma de reconstruir el historial exacto de otorgado/usado
-- antes de este contador, así que se toma el saldo vivo actual como piso de
-- "otorgado" (sabemos que al menos eso se concedió) y "usado" queda en 0.
UPDATE "User" SET "featuredVouchersGranted" = "pendingFeaturedVouchers" WHERE "pendingFeaturedVouchers" > 0;

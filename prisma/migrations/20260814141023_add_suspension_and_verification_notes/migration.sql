
-- AlterEnum
ALTER TYPE "ListingStatus" ADD VALUE 'SUSPENDIDA';

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "suspendedUntil" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "suspendedUntil" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT;

-- AlterTable
ALTER TABLE "VerificationRequest" ADD COLUMN     "adminNote" TEXT;


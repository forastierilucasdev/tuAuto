-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pendingFeaturedVouchers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionQuota" INTEGER NOT NULL DEFAULT 0;

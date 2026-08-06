-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "quantity" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "purchasedPublications" INTEGER NOT NULL DEFAULT 0;

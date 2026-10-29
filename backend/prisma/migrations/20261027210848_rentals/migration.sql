-- CreateEnum
CREATE TYPE "RentalUnit" AS ENUM ('DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('PURCHASE', 'RENTAL');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "rentalsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "type" "LeadType" NOT NULL DEFAULT 'PURCHASE';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "forSale" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "product_rentals" (
    "productId" TEXT NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "unit" "RentalUnit" NOT NULL DEFAULT 'DAY',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_rentals_pkey" PRIMARY KEY ("productId")
);

-- AddForeignKey
ALTER TABLE "product_rentals" ADD CONSTRAINT "product_rentals_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - The values [CUSTOMER] on the enum `SystemRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SystemRole_new" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPANY_STAFF', 'AGENT');
ALTER TABLE "users" ALTER COLUMN "systemRole" TYPE "SystemRole_new" USING ("systemRole"::text::"SystemRole_new");
ALTER TYPE "SystemRole" RENAME TO "SystemRole_old";
ALTER TYPE "SystemRole_new" RENAME TO "SystemRole";
DROP TYPE "public"."SystemRole_old";
COMMIT;

-- DropIndex
DROP INDEX "companies_name_key";

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "ghanaCardNumber" TEXT,
    "address" TEXT,
    "region" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');

-- DropIndex
DROP INDEX "customers_email_key";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phoneKey" TEXT;

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneKey" TEXT NOT NULL,
    "location" TEXT,
    "productId" TEXT,
    "productName" TEXT,
    "customRequest" TEXT,
    "referralCode" TEXT,
    "agentId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "customerId" TEXT,
    "contactedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_companyId_status_createdAt_idx" ON "leads"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "leads_companyId_phoneKey_idx" ON "leads"("companyId", "phoneKey");

-- CreateIndex
CREATE INDEX "customers_companyId_phoneKey_idx" ON "customers"("companyId", "phoneKey");

-- CreateIndex
CREATE UNIQUE INDEX "customers_companyId_email_key" ON "customers"("companyId", "email");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill phoneKey for existing customers (digits only; Ghana 0XXXXXXXXX → 233XXXXXXXXX)
UPDATE "customers"
SET "phoneKey" = CASE
  WHEN regexp_replace("phone", '\D', '', 'g') ~ '^0\d{9}$'
    THEN '233' || substring(regexp_replace("phone", '\D', '', 'g') FROM 2)
  ELSE regexp_replace("phone", '\D', '', 'g')
END
WHERE "phoneKey" IS NULL;

-- "Full Access" roles get the new leads resource (idempotent)
INSERT INTO "role_permissions" ("id", "roleId", "resource", "actions")
SELECT gen_random_uuid()::text, r."id", 'leads', ARRAY['create', 'read', 'update', 'delete']
FROM "roles" r
WHERE r."name" = 'Full Access'
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" p
    WHERE p."roleId" = r."id" AND p."resource" = 'leads'
  );

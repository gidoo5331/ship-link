-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductAvailability" AS ENUM ('AVAILABLE', 'ON_REQUEST', 'SOLD');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "specTemplate" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "availability" "ProductAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "leadTime" TEXT,
    "images" TEXT[],
    "specs" JSONB NOT NULL DEFAULT '[]',
    "features" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_companyId_slug_key" ON "categories"("companyId", "slug");

-- CreateIndex
CREATE INDEX "products_companyId_status_categoryId_idx" ON "products"("companyId", "status", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "products_companyId_slug_key" ON "products"("companyId", "slug");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

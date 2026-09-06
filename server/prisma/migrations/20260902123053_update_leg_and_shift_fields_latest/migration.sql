/*
  Warnings:

  - You are about to drop the column `company_name` on the `runsheet_legs` table. All the data in the column will be lost.
  - You are about to drop the column `suburb` on the `runsheet_legs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "runsheet_legs_company_name_idx";

-- AlterTable
ALTER TABLE "runsheet_legs" DROP COLUMN "company_name",
DROP COLUMN "suburb",
ADD COLUMN     "collection_company" TEXT,
ADD COLUMN     "collection_suburb" TEXT,
ADD COLUMN     "delivery_company" TEXT,
ADD COLUMN     "delivery_suburb" TEXT;

-- AlterTable
ALTER TABLE "runsheets" ADD COLUMN     "business_name" TEXT,
ADD COLUMN     "rego" TEXT,
ADD COLUMN     "subcontractor_name" TEXT,
ADD COLUMN     "yard_location" TEXT;

-- CreateIndex
CREATE INDEX "runsheet_legs_collection_company_idx" ON "runsheet_legs"("collection_company");

-- CreateIndex
CREATE INDEX "runsheet_legs_delivery_company_idx" ON "runsheet_legs"("delivery_company");

/*
  Warnings:

  - You are about to drop the column `uploadedAt` on the `Photo` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_businessId_fkey";

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "uploadedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "businessId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("business_id") ON DELETE SET NULL ON UPDATE CASCADE;

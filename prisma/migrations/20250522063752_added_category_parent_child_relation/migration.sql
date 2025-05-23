/*
  Warnings:

  - You are about to drop the column `faq_last_generated_at` on the `ListingBusiness` table. All the data in the column will be lost.
  - Made the column `slug` on table `ListingCategory` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "ListingBusiness" DROP CONSTRAINT "ListingBusiness_user_id_fkey";

-- AlterTable
ALTER TABLE "ListingBusiness" DROP COLUMN "faq_last_generated_at",
ADD COLUMN     "faqLastGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "faqOptimized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metaTitle" VARCHAR(255),
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ListingCategory" ADD COLUMN     "parent_category_id" INTEGER,
ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "OwnershipClaim" (
    "claim_id" SERIAL NOT NULL,
    "listing_business_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "claimant_name" TEXT NOT NULL,
    "company_name" TEXT,
    "claimant_email" TEXT NOT NULL,
    "claimant_phone" TEXT,
    "message" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "admin_notes" TEXT,

    CONSTRAINT "OwnershipClaim_pkey" PRIMARY KEY ("claim_id")
);

-- CreateIndex
CREATE INDEX "OwnershipClaim_listing_business_id_idx" ON "OwnershipClaim"("listing_business_id");

-- CreateIndex
CREATE INDEX "OwnershipClaim_user_id_idx" ON "OwnershipClaim"("user_id");

-- CreateIndex
CREATE INDEX "OwnershipClaim_status_idx" ON "OwnershipClaim"("status");

-- AddForeignKey
ALTER TABLE "ListingBusiness" ADD CONSTRAINT "ListingBusiness_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingCategory" ADD CONSTRAINT "ListingCategory_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "ListingCategory"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipClaim" ADD CONSTRAINT "OwnershipClaim_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipClaim" ADD CONSTRAINT "OwnershipClaim_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

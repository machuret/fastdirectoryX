/*
  Warnings:

  - You are about to drop the column `is_cover_image` on the `ListingImageUrl` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `ListingImageUrl` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `ListingReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `ListingReviewImageUrl` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ListingImageUrl" DROP COLUMN "is_cover_image",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ListingReview" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ListingReviewImageUrl" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ListingReview_listing_business_id_idx" ON "ListingReview"("listing_business_id");

-- CreateIndex
CREATE INDEX "ListingReview_rating_idx" ON "ListingReview"("rating");

-- CreateIndex
CREATE INDEX "ListingReview_created_at_idx" ON "ListingReview"("created_at");

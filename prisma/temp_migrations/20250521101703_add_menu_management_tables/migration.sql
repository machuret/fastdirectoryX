/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `ListingBusiness` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `ListingBusiness` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ListingBusinessAttribute" DROP CONSTRAINT "ListingBusinessAttribute_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingBusinessCategory" DROP CONSTRAINT "ListingBusinessCategory_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingBusinessImageCategory" DROP CONSTRAINT "ListingBusinessImageCategory_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingBusinessOrderLink" DROP CONSTRAINT "ListingBusinessOrderLink_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingBusinessReviewTag" DROP CONSTRAINT "ListingBusinessReviewTag_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingImageUrl" DROP CONSTRAINT "ListingImageUrl_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingOpeningHour" DROP CONSTRAINT "ListingOpeningHour_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingPeopleAlsoSearch" DROP CONSTRAINT "ListingPeopleAlsoSearch_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingPopularTimesHistogram" DROP CONSTRAINT "ListingPopularTimesHistogram_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingReview" DROP CONSTRAINT "ListingReview_listing_business_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingReviewImageUrl" DROP CONSTRAINT "ListingReviewImageUrl_listing_review_id_fkey";

-- DropForeignKey
ALTER TABLE "ListingReviewsDistribution" DROP CONSTRAINT "ListingReviewsDistribution_listing_business_id_fkey";

-- AlterTable
ALTER TABLE "ListingBusiness" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "OpeningHours" (
    "id" TEXT NOT NULL,
    "listing_id" BIGINT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "open_time" TEXT,
    "close_time" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "target" TEXT,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpeningHours_listing_id_idx" ON "OpeningHours"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "OpeningHours_listing_id_day_of_week_key" ON "OpeningHours"("listing_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_location_key" ON "Menu"("location");

-- CreateIndex
CREATE UNIQUE INDEX "ListingBusiness_slug_key" ON "ListingBusiness"("slug");

-- AddForeignKey
ALTER TABLE "ListingBusinessCategory" ADD CONSTRAINT "ListingBusinessCategory_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessImageCategory" ADD CONSTRAINT "ListingBusinessImageCategory_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingOpeningHour" ADD CONSTRAINT "ListingOpeningHour_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPeopleAlsoSearch" ADD CONSTRAINT "ListingPeopleAlsoSearch_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessReviewTag" ADD CONSTRAINT "ListingBusinessReviewTag_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessAttribute" ADD CONSTRAINT "ListingBusinessAttribute_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReviewsDistribution" ADD CONSTRAINT "ListingReviewsDistribution_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessOrderLink" ADD CONSTRAINT "ListingBusinessOrderLink_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImageUrl" ADD CONSTRAINT "ListingImageUrl_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReview" ADD CONSTRAINT "ListingReview_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReviewImageUrl" ADD CONSTRAINT "ListingReviewImageUrl_listing_review_id_fkey" FOREIGN KEY ("listing_review_id") REFERENCES "ListingReview"("review_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPopularTimesHistogram" ADD CONSTRAINT "ListingPopularTimesHistogram_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "ListingBusiness"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

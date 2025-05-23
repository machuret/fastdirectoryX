/*
  Warnings:

  - The primary key for the `Business` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Business` table. All the data in the column will be lost.
  - The primary key for the `BusinessCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ListingBusiness` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `business_id` on the `ListingBusiness` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingBusinessAttribute` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `listing_business_id` on the `ListingBusinessAttribute` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingBusinessCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `listing_business_id` on the `ListingBusinessCategory` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingBusinessImageCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `listing_business_id` on the `ListingBusinessImageCategory` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingBusinessOrderLink` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `business_order_link_id` on the `ListingBusinessOrderLink` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `listing_business_id` on the `ListingBusinessOrderLink` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingBusinessReviewTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `listing_business_id` on the `ListingBusinessReviewTag` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingImageUrl` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `image_url_id` on the `ListingImageUrl` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `listing_business_id` on the `ListingImageUrl` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingPeopleAlsoSearch` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `pas_id` on the `ListingPeopleAlsoSearch` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `listing_business_id` on the `ListingPeopleAlsoSearch` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingPopularTimesHistogram` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `histogram_id` on the `ListingPopularTimesHistogram` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `listing_business_id` on the `ListingPopularTimesHistogram` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingReview` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `review_id` on the `ListingReview` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `listing_business_id` on the `ListingReview` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ListingReviewImageUrl` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `listing_review_id` on the `ListingReviewImageUrl` table. All the data in the column will be lost.
  - You are about to drop the column `review_image_url_id` on the `ListingReviewImageUrl` table. All the data in the column will be lost.
  - The primary key for the `ListingReviewsDistribution` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `reviews_distribution_id` on the `ListingReviewsDistribution` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `listing_business_id` on the `ListingReviewsDistribution` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `listing_id` on the `OpeningHours` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `Review` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `businessId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Review` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ListingOpeningHour` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,business_id]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `userId` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `user_id` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `businessId` on the `BusinessCategory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `user_id` to the `ListingBusiness` table without a default value. This is not possible if the table is not empty.
  - Added the required column `review_id` to the `ListingReviewImageUrl` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `businessId` on the `Photo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `business_id` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `userId` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessCategory" DROP CONSTRAINT "BusinessCategory_businessId_fkey";

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

-- DropForeignKey
ALTER TABLE "OpeningHours" DROP CONSTRAINT "OpeningHours_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "ListingReview_created_at_idx";

-- DropIndex
DROP INDEX "ListingReview_listing_business_id_idx";

-- DropIndex
DROP INDEX "ListingReview_rating_idx";

-- DropIndex
DROP INDEX "ListingReviewImageUrl_listing_review_id_idx";

-- DropIndex
DROP INDEX "Review_userId_businessId_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Business" DROP CONSTRAINT "Business_pkey",
DROP COLUMN "id",
DROP COLUMN "ownerId",
ADD COLUMN     "business_id" SERIAL NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "Business_pkey" PRIMARY KEY ("business_id");

-- AlterTable
ALTER TABLE "BusinessCategory" DROP CONSTRAINT "BusinessCategory_pkey",
DROP COLUMN "businessId",
ADD COLUMN     "businessId" INTEGER NOT NULL,
ADD CONSTRAINT "BusinessCategory_pkey" PRIMARY KEY ("businessId", "categoryId");

-- AlterTable
ALTER TABLE "ListingBusiness" DROP CONSTRAINT "ListingBusiness_pkey",
ADD COLUMN     "facebook_url" TEXT,
ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "linkedin_url" TEXT,
ADD COLUMN     "listing_business_id" SERIAL NOT NULL,
ADD COLUMN     "pinterest_url" TEXT,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD COLUMN     "x_com_url" TEXT,
ADD COLUMN     "youtube_url" TEXT,
ALTER COLUMN "business_id" DROP DEFAULT,
ALTER COLUMN "business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingBusiness_pkey" PRIMARY KEY ("listing_business_id");
DROP SEQUENCE "ListingBusiness_business_id_seq";

-- AlterTable
ALTER TABLE "ListingBusinessAttribute" DROP CONSTRAINT "ListingBusinessAttribute_pkey",
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingBusinessAttribute_pkey" PRIMARY KEY ("listing_business_id", "listing_attribute_id");

-- AlterTable
ALTER TABLE "ListingBusinessCategory" DROP CONSTRAINT "ListingBusinessCategory_pkey",
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingBusinessCategory_pkey" PRIMARY KEY ("listing_business_id", "listing_category_id");

-- AlterTable
ALTER TABLE "ListingBusinessImageCategory" DROP CONSTRAINT "ListingBusinessImageCategory_pkey",
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingBusinessImageCategory_pkey" PRIMARY KEY ("listing_business_id", "listing_image_category_id");

-- AlterTable
ALTER TABLE "ListingBusinessOrderLink" DROP CONSTRAINT "ListingBusinessOrderLink_pkey",
ALTER COLUMN "business_order_link_id" SET DATA TYPE SERIAL,
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingBusinessOrderLink_pkey" PRIMARY KEY ("business_order_link_id");

-- AlterTable
ALTER TABLE "ListingBusinessReviewTag" DROP CONSTRAINT "ListingBusinessReviewTag_pkey",
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingBusinessReviewTag_pkey" PRIMARY KEY ("listing_business_id", "listing_review_tag_id");

-- AlterTable
ALTER TABLE "ListingImageUrl" DROP CONSTRAINT "ListingImageUrl_pkey",
ALTER COLUMN "image_url_id" SET DATA TYPE SERIAL,
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingImageUrl_pkey" PRIMARY KEY ("image_url_id");

-- AlterTable
ALTER TABLE "ListingPeopleAlsoSearch" DROP CONSTRAINT "ListingPeopleAlsoSearch_pkey",
ALTER COLUMN "pas_id" SET DATA TYPE SERIAL,
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingPeopleAlsoSearch_pkey" PRIMARY KEY ("pas_id");

-- AlterTable
ALTER TABLE "ListingPopularTimesHistogram" DROP CONSTRAINT "ListingPopularTimesHistogram_pkey",
ALTER COLUMN "histogram_id" SET DATA TYPE SERIAL,
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingPopularTimesHistogram_pkey" PRIMARY KEY ("histogram_id");

-- AlterTable
ALTER TABLE "ListingReview" DROP CONSTRAINT "ListingReview_pkey",
ALTER COLUMN "review_id" SET DATA TYPE SERIAL,
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingReview_pkey" PRIMARY KEY ("review_id");

-- AlterTable
ALTER TABLE "ListingReviewImageUrl" DROP CONSTRAINT "ListingReviewImageUrl_pkey",
DROP COLUMN "listing_review_id",
DROP COLUMN "review_image_url_id",
ADD COLUMN     "review_id" INTEGER NOT NULL,
ADD COLUMN     "review_image_id" SERIAL NOT NULL,
ADD CONSTRAINT "ListingReviewImageUrl_pkey" PRIMARY KEY ("review_image_id");

-- AlterTable
ALTER TABLE "ListingReviewsDistribution" DROP CONSTRAINT "ListingReviewsDistribution_pkey",
ALTER COLUMN "reviews_distribution_id" SET DATA TYPE SERIAL,
ALTER COLUMN "listing_business_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "ListingReviewsDistribution_pkey" PRIMARY KEY ("reviews_distribution_id");

-- AlterTable
ALTER TABLE "OpeningHours" ALTER COLUMN "listing_id" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "businessId",
ADD COLUMN     "businessId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Review" DROP CONSTRAINT "Review_pkey",
DROP COLUMN "businessId",
DROP COLUMN "id",
DROP COLUMN "userId",
ADD COLUMN     "business_id" INTEGER NOT NULL,
ADD COLUMN     "review_id" SERIAL NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "Review_pkey" PRIMARY KEY ("review_id");

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "user_id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");

-- DropTable
DROP TABLE "ListingOpeningHour";

-- CreateIndex
CREATE INDEX "ListingReviewImageUrl_review_id_idx" ON "ListingReviewImageUrl"("review_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_user_id_business_id_key" ON "Review"("user_id", "business_id");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCategory" ADD CONSTRAINT "BusinessCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusiness" ADD CONSTRAINT "ListingBusiness_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusiness" ADD CONSTRAINT "ListingBusiness_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessCategory" ADD CONSTRAINT "ListingBusinessCategory_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessImageCategory" ADD CONSTRAINT "ListingBusinessImageCategory_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPeopleAlsoSearch" ADD CONSTRAINT "ListingPeopleAlsoSearch_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessReviewTag" ADD CONSTRAINT "ListingBusinessReviewTag_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessAttribute" ADD CONSTRAINT "ListingBusinessAttribute_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReviewsDistribution" ADD CONSTRAINT "ListingReviewsDistribution_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingBusinessOrderLink" ADD CONSTRAINT "ListingBusinessOrderLink_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImageUrl" ADD CONSTRAINT "ListingImageUrl_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReview" ADD CONSTRAINT "ListingReview_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingReviewImageUrl" ADD CONSTRAINT "ListingReviewImageUrl_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "ListingReview"("review_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPopularTimesHistogram" ADD CONSTRAINT "ListingPopularTimesHistogram_listing_business_id_fkey" FOREIGN KEY ("listing_business_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "ListingBusiness"("listing_business_id") ON DELETE CASCADE ON UPDATE CASCADE;

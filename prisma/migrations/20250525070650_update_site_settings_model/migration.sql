/*
  Warnings:

  - You are about to drop the column `address` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `allowUserRegistration` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `bingSiteVerificationId` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `defaultListingStatus` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `defaultUserRole` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `facebookUrl` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `faviconUrl` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `footerScripts` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `googleAnalyticsId` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `googleSiteVerificationId` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `headerScripts` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `instagramUrl` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `linkedinUrl` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `maintenanceMode` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `seoDescription` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `seoKeywords` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `seoTitle` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `tagline` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `themeColor` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `twitterUrl` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `youtubeUrl` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the `Prompt` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "SiteSettings" DROP COLUMN "address",
DROP COLUMN "allowUserRegistration",
DROP COLUMN "bingSiteVerificationId",
DROP COLUMN "contactEmail",
DROP COLUMN "contactPhone",
DROP COLUMN "defaultListingStatus",
DROP COLUMN "defaultUserRole",
DROP COLUMN "facebookUrl",
DROP COLUMN "faviconUrl",
DROP COLUMN "footerScripts",
DROP COLUMN "googleAnalyticsId",
DROP COLUMN "googleSiteVerificationId",
DROP COLUMN "headerScripts",
DROP COLUMN "instagramUrl",
DROP COLUMN "linkedinUrl",
DROP COLUMN "logoUrl",
DROP COLUMN "maintenanceMode",
DROP COLUMN "seoDescription",
DROP COLUMN "seoKeywords",
DROP COLUMN "seoTitle",
DROP COLUMN "tagline",
DROP COLUMN "themeColor",
DROP COLUMN "twitterUrl",
DROP COLUMN "youtubeUrl",
ADD COLUMN     "adminEmail" TEXT,
ADD COLUMN     "contactFormDetails" TEXT,
ADD COLUMN     "contactFormTitle" TEXT,
ALTER COLUMN "siteName" DROP NOT NULL,
ALTER COLUMN "siteName" DROP DEFAULT;

-- DropTable
DROP TABLE "Prompt";

/*
  Warnings:

  - You are about to drop the column `admin_email` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `contact_email` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `contact_form_details` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `contact_form_title` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `favicon_url` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `footer_text` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `logo_url` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `maintenance_mode` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `site_name` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `site_tagline` on the `SiteSettings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SiteSettings_id_key";

-- AlterTable
ALTER TABLE "SiteSettings" DROP COLUMN "admin_email",
DROP COLUMN "contact_email",
DROP COLUMN "contact_form_details",
DROP COLUMN "contact_form_title",
DROP COLUMN "favicon_url",
DROP COLUMN "footer_text",
DROP COLUMN "logo_url",
DROP COLUMN "maintenance_mode",
DROP COLUMN "site_name",
DROP COLUMN "site_tagline",
ADD COLUMN     "address" TEXT DEFAULT '123 Main St, Anytown, USA',
ADD COLUMN     "allowUserRegistration" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bingSiteVerificationId" TEXT,
ADD COLUMN     "contactEmail" TEXT DEFAULT 'contact@example.com',
ADD COLUMN     "contactPhone" TEXT DEFAULT '123-456-7890',
ADD COLUMN     "defaultListingStatus" TEXT DEFAULT 'PENDING',
ADD COLUMN     "defaultUserRole" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "faviconUrl" TEXT DEFAULT '/favicon.ico',
ADD COLUMN     "footerScripts" TEXT,
ADD COLUMN     "googleAnalyticsId" TEXT,
ADD COLUMN     "googleSiteVerificationId" TEXT,
ADD COLUMN     "headerScripts" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT DEFAULT '/logo.png',
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seoDescription" TEXT DEFAULT 'Default SEO Description',
ADD COLUMN     "seoKeywords" TEXT DEFAULT 'keyword1, keyword2, keyword3',
ADD COLUMN     "seoTitle" TEXT DEFAULT 'Default SEO Title',
ADD COLUMN     "siteName" TEXT NOT NULL DEFAULT 'Default Site Name',
ADD COLUMN     "tagline" TEXT DEFAULT 'Your default tagline here',
ADD COLUMN     "themeColor" TEXT DEFAULT '#FFFFFF',
ADD COLUMN     "twitterUrl" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "topicIdea" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "openAIModel" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

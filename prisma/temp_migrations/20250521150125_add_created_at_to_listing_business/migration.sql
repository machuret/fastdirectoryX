-- AlterTable
ALTER TABLE "ListingBusiness" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "faq" JSONB,
ADD COLUMN     "faq_last_generated_at" TIMESTAMP(3);

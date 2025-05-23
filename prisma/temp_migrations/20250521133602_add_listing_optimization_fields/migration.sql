-- AlterTable
ALTER TABLE "ListingBusiness" ADD COLUMN     "descriptionLastOptimizedAt" TIMESTAMP(3),
ADD COLUMN     "descriptionOptimized" BOOLEAN NOT NULL DEFAULT false;

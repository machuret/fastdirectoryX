/*
  Warnings:

  - You are about to drop the column `isRead` on the `ContactMessage` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ContactMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_parentId_fkey";

-- AlterTable
ALTER TABLE "ContactMessage" DROP COLUMN "isRead",
DROP COLUMN "updatedAt",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'UNREAD',
ALTER COLUMN "subject" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "icon" TEXT;

-- CreateIndex
CREATE INDEX "MenuItem_menuId_idx" ON "MenuItem"("menuId");

-- CreateIndex
CREATE INDEX "MenuItem_parentId_idx" ON "MenuItem"("parentId");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

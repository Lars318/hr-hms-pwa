-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "managerId" TEXT;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Profile_managerId_idx" ON "Profile"("managerId");

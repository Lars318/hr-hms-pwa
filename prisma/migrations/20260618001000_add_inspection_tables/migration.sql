-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionAnswer" AS ENUM ('YES', 'NO', 'PARTIAL', 'NA');

-- CreateTable
CREATE TABLE "InspectionTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplateItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "InspectionTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templateId" TEXT NOT NULL,
    "locationId" TEXT,
    "performedById" TEXT NOT NULL,

    CONSTRAINT "InspectionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionResponse" (
    "id" TEXT NOT NULL,
    "answer" "InspectionAnswer" NOT NULL,
    "comment" TEXT,
    "photoUrl" TEXT,
    "recordId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "InspectionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspectionTemplateItem_templateId_idx" ON "InspectionTemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "InspectionRecord_performedById_idx" ON "InspectionRecord"("performedById");

-- CreateIndex
CREATE INDEX "InspectionRecord_templateId_idx" ON "InspectionRecord"("templateId");

-- CreateIndex
CREATE INDEX "InspectionRecord_status_idx" ON "InspectionRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionResponse_recordId_itemId_key" ON "InspectionResponse"("recordId", "itemId");

-- CreateIndex
CREATE INDEX "InspectionResponse_recordId_idx" ON "InspectionResponse"("recordId");

-- AddForeignKey
ALTER TABLE "InspectionTemplateItem" ADD CONSTRAINT "InspectionTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionResponse" ADD CONSTRAINT "InspectionResponse_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "InspectionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionResponse" ADD CONSTRAINT "InspectionResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InspectionTemplateItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "HandbookDocument" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandbookDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HandbookDocument_createdAt_idx" ON "HandbookDocument"("createdAt");


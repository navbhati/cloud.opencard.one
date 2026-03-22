-- CreateEnum
CREATE TYPE "BlobCategory" AS ENUM ('UPLOAD', 'TEMPLATE', 'EXPORT', 'DESIGN', 'ASSET', 'TEMP');

-- CreateEnum
CREATE TYPE "BlobVisibility" AS ENUM ('PRIVATE', 'PUBLIC', 'SHARED');

-- CreateTable
CREATE TABLE "Blob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "category" "BlobCategory" NOT NULL DEFAULT 'UPLOAD',
    "visibility" "BlobVisibility" NOT NULL DEFAULT 'PRIVATE',
    "folder" TEXT,
    "metadata" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Blob_pathname_key" ON "Blob"("pathname");

-- CreateIndex
CREATE INDEX "Blob_userId_category_idx" ON "Blob"("userId", "category");

-- CreateIndex
CREATE INDEX "Blob_pathname_idx" ON "Blob"("pathname");

-- CreateIndex
CREATE INDEX "Blob_userId_createdAt_idx" ON "Blob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Blob_expiresAt_idx" ON "Blob"("expiresAt");

-- AddForeignKey
ALTER TABLE "Blob" ADD CONSTRAINT "Blob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

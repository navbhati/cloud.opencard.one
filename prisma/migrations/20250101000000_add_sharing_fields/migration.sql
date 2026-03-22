-- AlterTable
ALTER TABLE "Chat" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Chat" ADD COLUMN "shareToken" TEXT;

-- AlterTable
ALTER TABLE "Source" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Source" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_shareToken_key" ON "Chat"("shareToken");

-- CreateIndex
CREATE INDEX "Chat_shareToken_idx" ON "Chat"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Source_shareToken_key" ON "Source"("shareToken");

-- CreateIndex
CREATE INDEX "Source_shareToken_idx" ON "Source"("shareToken");

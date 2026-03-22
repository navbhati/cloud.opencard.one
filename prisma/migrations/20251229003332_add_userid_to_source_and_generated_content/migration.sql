-- Add userId column to Source table (nullable initially)
ALTER TABLE "Source" ADD COLUMN "userId" TEXT;

-- Add userId column to GeneratedContent table (nullable initially)
ALTER TABLE "GeneratedContent" ADD COLUMN "userId" TEXT;

-- Assign all existing sources to the first user (or create a system user if none exists)
-- First, try to get the first user
DO $$
DECLARE
    first_user_id TEXT;
BEGIN
    -- Get the first user from the database
    SELECT id INTO first_user_id FROM "User" ORDER BY "createdAt" ASC LIMIT 1;
    
    -- If no user exists, we'll need to handle this case
    -- For now, we'll create a placeholder that will need manual intervention
    IF first_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in database. Please create a user first or manually assign sources.';
    END IF;
    
    -- Update all existing sources to belong to the first user
    UPDATE "Source" SET "userId" = first_user_id WHERE "userId" IS NULL;
    
    -- Update all existing generated content to belong to the same user as their source
    UPDATE "GeneratedContent" gc
    SET "userId" = s."userId"
    FROM "Source" s
    WHERE gc."sourceId" = s.id AND gc."userId" IS NULL;
END $$;

-- Make userId non-nullable in Source table
ALTER TABLE "Source" ALTER COLUMN "userId" SET NOT NULL;

-- Make userId non-nullable in GeneratedContent table
ALTER TABLE "GeneratedContent" ALTER COLUMN "userId" SET NOT NULL;

-- Add foreign key constraint for Source.userId
ALTER TABLE "Source" ADD CONSTRAINT "Source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint for GeneratedContent.userId
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index on Source.userId
CREATE INDEX "Source_userId_idx" ON "Source"("userId");

-- Add index on GeneratedContent.userId
CREATE INDEX "GeneratedContent_userId_idx" ON "GeneratedContent"("userId");


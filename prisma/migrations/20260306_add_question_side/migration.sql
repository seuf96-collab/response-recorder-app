-- Add side column to questions table
-- Values: 'STATE' (default) or 'DEFENSE'
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "side" TEXT NOT NULL DEFAULT 'STATE';

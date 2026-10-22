-- Appearance: the paper colour printed under a design ("design" keeps the
-- design's own paper).
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "appearance_tone" text DEFAULT 'design' NOT NULL;

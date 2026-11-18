-- Bumped on every save of the couple's appearance settings; part of what a
-- guest's saved look is checked against, so a save sends every browser back
-- to the couple's design (lib/appearance.ts, appearanceBasis).
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "appearance_rev" integer DEFAULT 0 NOT NULL;

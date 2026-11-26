-- Whether a film theme's background moves (its live loop, or the slow
-- breathing of its picture) on the opening page and behind the letter.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "live_paper_enabled" boolean DEFAULT true NOT NULL;

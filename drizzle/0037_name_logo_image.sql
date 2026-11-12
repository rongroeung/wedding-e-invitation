-- The couple's own name-logo image (e.g. one a designer drew for them), shown
-- between the groom's and bride's names instead of the drawn monogram crest.
-- "foil" prints the image's light parts in the invitation's gold on any paper;
-- "original" shows the image exactly as uploaded.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "name_logo_media_id" text;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "name_logo_mode" text DEFAULT 'foil' NOT NULL;

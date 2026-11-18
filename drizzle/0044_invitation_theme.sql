-- The invitation's theme (lib/invitationTheme): khmer (the envelope), photo
-- (the couple's photograph as the opening page) or garden. Every existing
-- invitation stays on the Khmer theme it has always had.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "invitation_theme" text DEFAULT 'khmer' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "opening_photo_id" text;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "opening_photo_url" text DEFAULT '' NOT NULL;

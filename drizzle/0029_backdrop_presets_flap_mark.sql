-- Built-in background designs for the page and the card paper (none chosen
-- by default), and the choice of mark on the envelope flap (the name mark,
-- as now, by default).
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "page_bg_preset" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "card_bg_preset" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "envelope_flap_mark" text DEFAULT 'namelogo' NOT NULL;

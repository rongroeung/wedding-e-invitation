-- Appearance: the paper the card is printed on, the live layer of motion above
-- it, and whether guests may change them for themselves.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "appearance_paper" text DEFAULT 'classic-ivory' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "appearance_fx" text DEFAULT 'dust' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "appearance_level" text DEFAULT 'medium' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "appearance_guest_panel" boolean DEFAULT true NOT NULL;

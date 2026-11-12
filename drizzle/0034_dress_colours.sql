-- Wedding colours: the palette guests are asked to dress in. Empty by
-- default, and the section stays hidden until the couple adds a colour, so
-- an invitation that never sets one renders exactly as before.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "dress_code_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "dress_code_title" text DEFAULT 'ពណ៌សម្លៀកបំពាក់' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "dress_code_note" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "dress_colors" jsonb DEFAULT '[]'::jsonb NOT NULL;

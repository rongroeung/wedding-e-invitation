-- An opening sound for the first page, before the guest opens the invitation
-- (InvitationPage → PreMusic). Off until the couple adds one.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "pre_music_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "pre_music_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "pre_music_media_id" text;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "pre_music_loop" boolean DEFAULT true NOT NULL;

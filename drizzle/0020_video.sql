-- The pre-wedding film, played between the envelope and the curtains.
--
-- Off by default, and off is genuinely free: `video_enabled` false means the
-- invitation runs exactly the sequence it ran before this migration, with no
-- extra element mounted and nothing fetched.
--
-- A link and an upload are both allowed because neither one is enough on its
-- own. A wedding film is usually far larger than anything this app should be
-- storing in a `bytea` column, so the link is the normal answer; but a couple
-- who does not want their film on YouTube at all needs somewhere to put it, and
-- a short cut fits. When both are set the upload wins, on the grounds that
-- someone who went to the trouble of uploading a file meant it.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "video_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "video_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "video_media_id" text;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "video_poster_id" text;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "video_skip_label" text DEFAULT 'រំលងវីដេអូ' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "video_continue_label" text DEFAULT 'បន្តទៅលិខិតអញ្ជើញ' NOT NULL;

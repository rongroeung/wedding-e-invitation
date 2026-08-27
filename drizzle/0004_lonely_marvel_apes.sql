ALTER TABLE "wedding" ADD COLUMN "frame_source" text DEFAULT 'builtin' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_top_media_id" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_top_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_bottom_media_id" text;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_bottom_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_mirror_bottom" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_side_rules" boolean DEFAULT true NOT NULL;
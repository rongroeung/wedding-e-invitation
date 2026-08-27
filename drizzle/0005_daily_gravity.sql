ALTER TABLE "wedding" ALTER COLUMN "frame_motif" SET DEFAULT 'royal';--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_layout" text DEFAULT 'band' NOT NULL;
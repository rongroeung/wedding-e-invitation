ALTER TABLE "wedding" ADD COLUMN "frame_sticky" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_scale" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "font_scale" integer DEFAULT 100 NOT NULL;
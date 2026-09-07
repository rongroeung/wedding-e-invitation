ALTER TABLE "wedding" ADD COLUMN "frame_emboss" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_foil" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_depth" integer DEFAULT 55 NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_reveal" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_reveal_speed" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "frame_shimmer" boolean DEFAULT true NOT NULL;
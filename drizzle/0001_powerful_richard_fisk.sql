ALTER TABLE "wedding" ALTER COLUMN "open_button" SET DEFAULT 'បើកលិខិត';--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "color_primary" SET DEFAULT '#4A3527';--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "color_secondary" SET DEFAULT '#C29A5B';--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "color_accent" SET DEFAULT '#E3D3B8';--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "color_background" SET DEFAULT '#F6F3EE';--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "color_text" SET DEFAULT '#4A3A2C';--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "pattern" SET DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "name_latin" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "monogram" text DEFAULT '' NOT NULL;
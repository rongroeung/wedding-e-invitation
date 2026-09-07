ALTER TABLE "wedding" ADD COLUMN "envelope_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_style" text DEFAULT 'royal-khmer' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_paper" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_gold" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_seal" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_seal_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_animate" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_duration" integer DEFAULT 4200 NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_music" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_skip" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_every_visit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_open_label" text DEFAULT 'បើកសំបុត្រអញ្ជើញ' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_hint" text DEFAULT 'សូមចុចដើម្បីបើកសំបុត្រអញ្ជើញ' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN "envelope_skip_label" text DEFAULT 'រំលង' NOT NULL;
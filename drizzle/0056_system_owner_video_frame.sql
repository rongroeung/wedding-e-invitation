-- The system owner's details, shown at the end of every invitation
-- (SystemOwner). One row for the whole site, edited from the main workspace.
CREATE TABLE IF NOT EXISTS "system_owner" (
  "id" text PRIMARY KEY DEFAULT 'site' NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "message" text DEFAULT 'តើលោកអ្នកចាប់អារម្មណ៍នឹងប្រើប្រាស់សេវាកម្មសំបុត្រអញ្ជើញឌីជីថលរបស់ពួកយើង សម្រាប់កម្មវិធីរបស់លោកអ្នកដែរឬទេ? ទាក់ទងមកកាន់ពួកយើងតាមរយៈ' NOT NULL,
  "phone" text DEFAULT '' NOT NULL,
  "telegram" text DEFAULT '' NOT NULL,
  "instagram" text DEFAULT '' NOT NULL,
  "facebook" text DEFAULT '' NOT NULL,
  "tiktok" text DEFAULT '' NOT NULL,
  "youtube" text DEFAULT '' NOT NULL,
  "website" text DEFAULT '' NOT NULL,
  "links" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "system_owner" ("id") VALUES ('site') ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- The pre-wedding film's frame: 'portrait' (the size of the invitation) or
-- 'original' (the film's own shape, framed).
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "video_frame" text DEFAULT 'portrait' NOT NULL;

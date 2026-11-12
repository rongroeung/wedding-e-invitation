-- Workspaces: one per wedding.
--
-- The wedding row becomes the workspace. Everything that belonged to "the"
-- wedding (programme, story, gallery, guests, replies, views, uploads) gets a
-- wedding_id, and every existing row is filed under the existing wedding,
-- "main", which stays the default workspace at "/". Guest codes stay unique
-- across all workspaces, so every link already sent (/invite/CODE) keeps
-- working and finds its wedding from the code.
--
-- Written to be safe to run twice and safe on a live database: every step is
-- IF NOT EXISTS / ON CONFLICT, and the backfill uses a column default that is
-- left in place for instances of the previous code during a rollout.

-- the existing wedding is "main" (it always was; this only covers a database
-- whose row was never created, or carries another id)
UPDATE "wedding" SET "id" = 'main'
  WHERE NOT EXISTS (SELECT 1 FROM "wedding" WHERE "id" = 'main')
    AND "id" = (SELECT "id" FROM "wedding" ORDER BY "updated_at" LIMIT 1);
--> statement-breakpoint
-- (a SELECT that yields no row when "main" exists: ON CONFLICT would still
-- check the row's NOT NULL columns, which fails on a second run once "slug"
-- exists)
INSERT INTO "wedding" ("id") SELECT 'main' WHERE NOT EXISTS (SELECT 1 FROM "wedding" WHERE "id" = 'main');
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "slug" text;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "workspace_name" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "wedding" SET "slug" = "id" WHERE "slug" IS NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wedding_slug_idx" ON "wedding" ("slug");
--> statement-breakpoint

ALTER TABLE "wedding_events" ADD COLUMN IF NOT EXISTS "wedding_id" text DEFAULT 'main' NOT NULL;
--> statement-breakpoint
ALTER TABLE "story_items" ADD COLUMN IF NOT EXISTS "wedding_id" text DEFAULT 'main' NOT NULL;
--> statement-breakpoint
ALTER TABLE "gallery_images" ADD COLUMN IF NOT EXISTS "wedding_id" text DEFAULT 'main' NOT NULL;
--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "wedding_id" text DEFAULT 'main' NOT NULL;
--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN IF NOT EXISTS "wedding_id" text DEFAULT 'main' NOT NULL;
--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN IF NOT EXISTS "wedding_id" text DEFAULT 'main' NOT NULL;
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "wedding_id" text DEFAULT 'main' NOT NULL;
--> statement-breakpoint
-- The 'main' default stays in the database on purpose: while a deploy rolls
-- out, an instance still running the previous code may add a guest or a reply
-- without a wedding_id, and those belong to the one wedding that code knows.
-- The application itself always names the wedding (the schema in code has no
-- default, so it cannot forget).
CREATE INDEX IF NOT EXISTS "wedding_events_wedding_idx" ON "wedding_events" ("wedding_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_items_wedding_idx" ON "story_items" ("wedding_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gallery_images_wedding_idx" ON "gallery_images" ("wedding_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guests_wedding_idx" ON "guests" ("wedding_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rsvps_wedding_idx" ON "rsvps" ("wedding_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_wedding_idx" ON "page_views" ("wedding_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_wedding_idx" ON "media" ("wedding_id");
--> statement-breakpoint

-- the platform owner sees and creates every workspace; the first account is the owner
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_owner" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "users" SET "is_owner" = true
  WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "is_owner")
    AND "id" = (SELECT "id" FROM "users" ORDER BY "created_at" LIMIT 1);
--> statement-breakpoint

-- who may manage which wedding
CREATE TABLE IF NOT EXISTS "workspace_members" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "wedding_id" text NOT NULL REFERENCES "wedding"("id") ON DELETE CASCADE,
  "role" text DEFAULT 'admin' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "wedding_id")
);
--> statement-breakpoint
-- everyone who managed the wedding until now keeps managing it
INSERT INTO "workspace_members" ("user_id", "wedding_id")
  SELECT "id", 'main' FROM "users"
  ON CONFLICT DO NOTHING;

-- The handmade opening: anticipation, the seal pressed and lifted away, the
-- flap turned back on its hinge, the card drawn out, and the reveal. Each beat
-- needs its own time to read as a hand doing it, which puts the whole action
-- at about six seconds. Moved only where the record is still on the value the
-- last migration set; a couple who chose their own timing keeps it.
ALTER TABLE "wedding" ALTER COLUMN "envelope_duration" SET DEFAULT 6200;
--> statement-breakpoint
UPDATE "wedding" SET "envelope_duration" = 6200 WHERE "envelope_duration" = 5500;

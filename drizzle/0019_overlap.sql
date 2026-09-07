-- Shorter again, and for the last time.
--
-- The envelope no longer holds on a finished open state: the velvet dissolves
-- in over the panels while they are still swinging, so there is never a frame
-- of an empty lined box waiting for something to happen. What is left to time
-- is the seal, the swing, and the dissolve overlapping the back half of it.
--
-- Moved only where the record still holds the value the last migration set.
ALTER TABLE "wedding" ALTER COLUMN "envelope_duration" SET DEFAULT 2800;
--> statement-breakpoint
UPDATE "wedding" SET "envelope_duration" = 2800 WHERE "envelope_duration" = 5200;

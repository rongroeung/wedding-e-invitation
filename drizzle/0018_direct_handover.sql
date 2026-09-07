-- Shorter again, because there is less to see.
--
-- The envelope used to open, present the invitation, and only then hand over to
-- the curtains — a complete little reveal of its own, finished, before the
-- velvet had done anything. The invitation belongs behind the curtains, which
-- is the only place it is actually read, so that middle act has gone. What is
-- left is the panels opening and the hand-over, and it does not need seven
-- seconds.
--
-- Moved only where the record still holds the value the last migration set.
ALTER TABLE "wedding" ALTER COLUMN "envelope_duration" SET DEFAULT 5200;
--> statement-breakpoint
UPDATE "wedding" SET "envelope_duration" = 5200 WHERE "envelope_duration" = 7000;

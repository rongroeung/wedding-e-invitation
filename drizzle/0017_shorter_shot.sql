-- A shorter run. The opening beats are unchanged; what has gone is the dead
-- stretch between the invitation being revealed and the curtains starting to
-- move, which at nine seconds left the guest looking at a finished reveal with
-- nothing happening. Seven seconds of envelope plus the curtain's own two and a
-- bit puts the whole sequence just over nine.
--
-- Moved only where the record is still sitting on the value the last migration
-- set. A couple who has since chosen their own timing keeps it.
ALTER TABLE "wedding" ALTER COLUMN "envelope_duration" SET DEFAULT 7000;
--> statement-breakpoint
UPDATE "wedding" SET "envelope_duration" = 7000 WHERE "envelope_duration" = 9000;

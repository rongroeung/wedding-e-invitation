-- The flap envelope: a card that slides out, and a heading on the set.
--
-- The opening is now one handcrafted movement of about five and a half
-- seconds — the seal is pressed and lifted away, the flap folds back, the
-- card slides out and comes toward the camera, and the scene passes through a
-- brief dark moment into the curtains. At the old 2.8s the flap and the card
-- would be a blur. Moved only where the record is still on the value the last
-- migration set; a couple who chose their own timing keeps it.
ALTER TABLE "wedding" ALTER COLUMN "envelope_duration" SET DEFAULT 5500;
--> statement-breakpoint
UPDATE "wedding" SET "envelope_duration" = 5500 WHERE "envelope_duration" = 2800;
--> statement-breakpoint
-- The ceremonial heading set above the envelope, and the small script line
-- beneath it. Both editable; empty hides the line.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "envelope_title" text NOT NULL DEFAULT 'សិរីសួស្តីអាពាហ៍ពិពាហ៍';
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "envelope_subtitle" text NOT NULL DEFAULT 'The Wedding Invitation';

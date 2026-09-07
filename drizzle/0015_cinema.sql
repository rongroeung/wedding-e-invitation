-- The opening is now a cinematic sequence rather than a card animation, and it
-- has a shot's length: the brief asks for eight to twelve seconds, and the
-- curtain that parts after the envelope leaves takes about two and a half of
-- them on its own. Nine seconds for the envelope lands the whole thing at
-- roughly eleven and a half.
--
-- The existing row is moved only if it is still sitting on the old default. A
-- couple who has already chosen their own timing keeps it.
ALTER TABLE "wedding" ALTER COLUMN "envelope_duration" SET DEFAULT 9000;
--> statement-breakpoint
UPDATE "wedding" SET "envelope_duration" = 9000 WHERE "envelope_duration" = 4200;

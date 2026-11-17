-- The envelope set's heading: សិរីមង្គលអាពាហ៍ពិពាហ៍ (the same words as the letter's
-- title), and no English script line under it.
--
-- Only the old defaults are changed: a couple who wrote their own heading or
-- their own line under it keeps it. Both spellings of the old heading are
-- covered (ស្តី with ត, and ស្ដី with ដ, which look the same). Safe to run twice.
UPDATE "wedding" SET "envelope_title" = 'សិរីមង្គលអាពាហ៍ពិពាហ៍'
  WHERE "envelope_title" IN ('សិរីសួស្តីអាពាហ៍ពិពាហ៍', 'សិរីសួស្ដីអាពាហ៍ពិពាហ៍');
--> statement-breakpoint
UPDATE "wedding" SET "envelope_subtitle" = '' WHERE "envelope_subtitle" = 'The Wedding Invitation';
--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "envelope_title" SET DEFAULT 'សិរីមង្គលអាពាហ៍ពិពាហ៍';
--> statement-breakpoint
ALTER TABLE "wedding" ALTER COLUMN "envelope_subtitle" SET DEFAULT '';

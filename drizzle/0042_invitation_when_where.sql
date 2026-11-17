-- The letter's "when and where" in the couple's own wording, line by line.
-- Each is optional; an empty line falls back to the one built from the date,
-- time and venue fields, as before.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "invitation_when_intro" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "invitation_lunar_date" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "invitation_date_line" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "invitation_place" text DEFAULT '' NOT NULL;
--> statement-breakpoint
-- The wording the couple gave (2026-11-18), set once on the existing invitation.
UPDATE "wedding" SET
  "invitation_when_intro" = 'ដែលនឹងប្រព្រឹត្តទៅនៅ',
  "invitation_lunar_date" = 'ថ្ងៃសៅរ៍ ១០កើត ខែមិគសិរ ឆ្នាំមមី អដ្ឋស័ក ពុទ្ធសករាជ ២៥៧០ ត្រូវនឹង',
  "invitation_date_line" = 'ថ្ងៃទី១៩ ខែធ្នូ ឆ្នាំ២០២៦ វេលាម៉ោង ៥ៈ៣០ ល្ងាច',
  "invitation_place" = 'នៅគេហដ្ឋានខាងស្រី ស្ថិតនៅ ភូមិព្រៃទទឹង ឃុំជ្រៃ ស្រុកថ្មគោល ខេត្តបាត់ដំបង ដោយមេត្រីភាព។'
WHERE "invitation_when_intro" = '' AND "invitation_lunar_date" = '' AND "invitation_date_line" = '' AND "invitation_place" = '';

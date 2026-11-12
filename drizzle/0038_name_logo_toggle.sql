-- Show or hide the name logo between the groom's and bride's names (the
-- uploaded image or the drawn crest). On by default, as it is today.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "name_logo_enabled" boolean DEFAULT true NOT NULL;

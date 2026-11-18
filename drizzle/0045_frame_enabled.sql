-- Whether the card has a border at all (ស៊ុមសំបុត្រ). Every existing
-- invitation keeps the border it has.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "frame_enabled" boolean DEFAULT true NOT NULL;

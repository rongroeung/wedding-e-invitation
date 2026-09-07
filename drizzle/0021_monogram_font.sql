-- The face the couple's monogram is set in.
--
-- Stored as the catalogue's id (see src/lib/monogram-fonts.ts) rather than a
-- CSS family name, so a face can be renamed, respelled or given a different
-- file without rewriting rows — and so a value that is no longer offered falls
-- back to the default instead of asking a guest's browser for a font nobody
-- has. Existing weddings keep the setting they already had, which was Great
-- Vibes with no way to change it.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "monogram_font" text NOT NULL DEFAULT 'great-vibes';

-- The envelope and its room take their colours from the chosen paper, so the
-- opening and the card read as one set. On by default; off keeps the
-- envelope's own style (រូបរាងសំបុត្រ) and the burgundy room.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "envelope_match_paper" boolean DEFAULT true NOT NULL;

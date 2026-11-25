-- Wedding colours in groups (e.g. by day), each colour optionally shown as a
-- photo of its fabric (lib/dressColors).
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "dress_groups" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
-- The couple's own attire colours (their colour card, 2026-11-25), written once
-- to the invitation that carries their wording from 0042, while it has no groups.
UPDATE "wedding" SET
  "dress_code_enabled" = true,
  "dress_groups" = '[{"title":"Evening Attire","note":"December-19, 2026"},{"title":"Morning Attire","note":"December-18, 2026"}]'::jsonb,
  "dress_colors" = '[
    {"hex":"#efe6d2","name":"Cream","group":0,"image":"/dress/cream.webp"},
    {"hex":"#ece9a8","name":"Baby yellow","group":0,"image":"/dress/baby-yellow.webp"},
    {"hex":"#3a2220","name":"Chocolate","group":0,"image":"/dress/chocolate.webp"},
    {"hex":"#6b3a26","name":"Brown","group":0,"image":"/dress/brown.webp"},
    {"hex":"#b08a35","name":"Gold","group":1,"image":"/dress/gold-antique.webp"},
    {"hex":"#d39a4e","name":"Gold","group":1,"image":"/dress/gold-amber.webp"},
    {"hex":"#e2c991","name":"Gold","group":1,"image":"/dress/gold-champagne.webp"}
  ]'::jsonb
WHERE "invitation_date_line" = 'ថ្ងៃទី១៩ ខែធ្នូ ឆ្នាំ២០២៦ វេលាម៉ោង ៥ៈ៣០ ល្ងាច'
  AND "dress_groups" = '[]'::jsonb;

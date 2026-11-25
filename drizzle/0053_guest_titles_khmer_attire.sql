-- The couple's own honorifics for guests, added to the built-in ones (lib/guestTitles).
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "guest_titles" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
-- The attire colours written by 0052, in Khmer — only while they are still
-- exactly as 0052 wrote them.
UPDATE "wedding" SET
  "dress_groups" = '[{"title":"សម្លៀកបំពាក់ពេលល្ងាច","note":"ថ្ងៃទី១៩ ខែធ្នូ ឆ្នាំ២០២៦"},{"title":"សម្លៀកបំពាក់ពេលព្រឹក","note":"ថ្ងៃទី១៨ ខែធ្នូ ឆ្នាំ២០២៦"}]'::jsonb,
  "dress_colors" = '[
    {"hex":"#efe6d2","name":"ពណ៌ក្រែម","group":0,"image":"/dress/cream.webp"},
    {"hex":"#ece9a8","name":"ពណ៌លឿងស្រាល","group":0,"image":"/dress/baby-yellow.webp"},
    {"hex":"#3a2220","name":"ពណ៌សូកូឡា","group":0,"image":"/dress/chocolate.webp"},
    {"hex":"#6b3a26","name":"ពណ៌ត្នោត","group":0,"image":"/dress/brown.webp"},
    {"hex":"#b08a35","name":"ពណ៌មាស","group":1,"image":"/dress/gold-antique.webp"},
    {"hex":"#d39a4e","name":"ពណ៌មាស","group":1,"image":"/dress/gold-amber.webp"},
    {"hex":"#e2c991","name":"ពណ៌មាស","group":1,"image":"/dress/gold-champagne.webp"}
  ]'::jsonb
WHERE "dress_groups" = '[{"title":"Evening Attire","note":"December-19, 2026"},{"title":"Morning Attire","note":"December-18, 2026"}]'::jsonb;

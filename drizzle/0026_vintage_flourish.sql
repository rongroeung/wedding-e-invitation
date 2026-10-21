-- The couple's vintage flourish pack becomes the card's frame: its acanthus
-- corner, mirrored into all four corners. Moved only where the record is still
-- on the previous default (the gold kbach band); a couple who picked another
-- frame, or uploaded their own, keeps it. Both kbach and the royal corners
-- stay available in the dashboard.
ALTER TABLE "wedding" ALTER COLUMN "frame_motif" SET DEFAULT 'flourish';
--> statement-breakpoint
UPDATE "wedding" SET "frame_motif" = 'flourish' WHERE "frame_motif" = 'kbach' AND "frame_source" <> 'custom';

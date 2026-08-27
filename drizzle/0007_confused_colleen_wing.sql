ALTER TABLE "wedding" ALTER COLUMN "frame_motif" SET DEFAULT 'kbach';--> statement-breakpoint
-- Move existing rows onto the new artwork frame, unless the couple had already
-- chosen something other than the previous default.
UPDATE "wedding" SET "frame_motif" = 'kbach' WHERE "frame_motif" IN ('royal', 'lotus');

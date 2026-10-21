-- Design kits: the whole invitation's ornaments chosen as one set
-- (`lib/designKit`). Everyone starts on the vintage flourish kit, except a
-- couple who deliberately chose the Khmer gold band frame, whose card keeps
-- the Khmer ornaments that go with it.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "design_kit" text DEFAULT 'vintage-flourish' NOT NULL;
--> statement-breakpoint
UPDATE "wedding" SET "design_kit" = 'khmer-gold' WHERE "frame_motif" = 'kbach' AND "frame_source" <> 'custom';
--> statement-breakpoint
-- The frames no longer offered (the royal corners and the generated bands)
-- move to the default frame, so no saved invitation points at one.
UPDATE "wedding" SET "frame_motif" = 'flourish'
  WHERE "frame_motif" NOT IN ('flourish', 'flourish-loop', 'kbach');

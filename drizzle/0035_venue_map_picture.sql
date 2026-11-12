-- The couple's own picture of the map to the venue (a drawn or printed map,
-- or a screenshot), shown in the venue section. Empty by default.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "venue_map_media_id" text;

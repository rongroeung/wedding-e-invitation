-- The couple can switch the curtains off; on for everyone, as before.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "curtain_enabled" boolean DEFAULT true NOT NULL;

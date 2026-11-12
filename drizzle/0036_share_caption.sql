-- The message sent with each guest's invitation link (copied, or shared to
-- Telegram). Empty uses the app's own wording (lib/shareCaption).
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "share_caption" text DEFAULT '' NOT NULL;

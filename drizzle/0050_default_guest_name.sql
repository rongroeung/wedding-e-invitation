-- The name shown on the opening page and the cover when the link carries no guest
-- (the general link). It used to be the letter's honorific line.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "default_guest_name" text DEFAULT 'ភ្ញៀវកិត្តិយស' NOT NULL;

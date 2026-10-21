-- The couple's own artwork on the four surfaces the app draws itself.
--
-- Everything here is *additive* and every column has a default that means "as
-- before". An invitation that uploads nothing renders byte for byte what it
-- rendered yesterday, which is the only acceptable shape for a change to
-- four surfaces at once.
--
-- The media ids are nullable rather than defaulting to '': null is "no
-- artwork", and the one thing a blank string would buy — not having to check
-- for null — is worth less than being able to tell "never set" from "cleared".

-- THE ENVELOPE FACE ---------------------------------------------------------
-- Printed on the paper, in the envelope's own coordinate space, so the picture
-- runs across both sliding panels and meets exactly at the join. It is not a
-- replacement for the envelope: the gilt frame, the blind emboss and the wax
-- seal are still struck over it, and it still splits and slides apart.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "envelope_face_media_id" text;
-- cover | contain | stretch
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "envelope_face_fit" text NOT NULL DEFAULT 'cover';
-- How much of the paper colour is laid back over the picture, 0-100. A gold
-- frame over a busy photograph is unreadable; this is the dial that fixes it.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "envelope_face_scrim" integer NOT NULL DEFAULT 0;
-- Whether the gilt frame and the emboss are struck over the picture at all.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "envelope_face_ornament" boolean NOT NULL DEFAULT true;

-- THE CURTAINS --------------------------------------------------------------
-- Printed on the panels, which still part left and right and still gather as
-- they go. Video is allowed here and nowhere else: a looping cloth is the one
-- of these surfaces that genuinely reads better moving, and the curtains are
-- the only one of them that is not also the thing the guest has to tap.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "curtain_media_id" text;
-- image | video
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "curtain_media_kind" text NOT NULL DEFAULT 'image';
-- The frame shown while a video is still loading, and instead of it on a
-- device that refuses to autoplay.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "curtain_poster_id" text;
-- cover | contain | tile
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "curtain_fit" text NOT NULL DEFAULT 'cover';
-- Whether the drawn folds are draped over the picture as shading. They are not
-- painted over it — they are blended, so the picture keeps its own colour and
-- gains the curtain's light and shade.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "curtain_folds" boolean NOT NULL DEFAULT true;
-- How strongly, 0-100.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "curtain_shade" integer NOT NULL DEFAULT 55;

-- THE PAGE BEHIND EVERYTHING ------------------------------------------------
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "page_bg_media_id" text;
-- cover | contain | tile
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "page_bg_fit" text NOT NULL DEFAULT 'cover';
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "page_bg_scrim" integer NOT NULL DEFAULT 0;

-- THE CARD'S OWN PAPER ------------------------------------------------------
-- This one is under the writing, so its scrim defaults high. A photograph at
-- full strength behind Khmer body text is not a design choice, it is an
-- invitation nobody can read.
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "card_bg_media_id" text;
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "card_bg_fit" text NOT NULL DEFAULT 'cover';
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "card_bg_scrim" integer NOT NULL DEFAULT 55;

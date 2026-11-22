-- Between the names on the letter: ជាគូនឹង (on) or the couple's monogram (off, the default).
ALTER TABLE "wedding" ADD COLUMN IF NOT EXISTS "letter_join_text" boolean DEFAULT false NOT NULL;

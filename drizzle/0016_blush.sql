-- The blush palette, applied to a record that is still on the shipped default.
--
-- Only where nothing has been chosen yet: a couple who has already picked their
-- own colours keeps every one of them. `color_primary` is the sentinel because
-- it is the value the palette pickers always set first.
UPDATE "wedding" SET
  "color_primary"    = '#6B3A48',
  "color_secondary"  = '#C9A96E',
  "color_accent"     = '#F7D6DE',
  "color_background" = '#FFF9F5',
  "color_text"       = '#5A3A42',
  "envelope_style"   = 'blush-rose'
WHERE "color_primary" = '#4A3527';

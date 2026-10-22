/**
 * The sheet the invitation is printed on, in plates: tone and light, the
 * recessed channel, a fine all-over pattern, carved relief, the flowers'
 * washes (leaf, petal, heart), the engraving, the foil accents, the bands of
 * ornament along the edges, a slow glint across the foil, a blind
 * impression, and the cotton's own fibre. A design turns on only the layers
 * it uses. Purely decorative and entirely styled by the paper theme on
 * <html>: the artwork comes from scripts/collection-art.py and
 * scripts/stationery-art.py, each paper places it (lib/paperThemes, "the
 * composed papers"; base layers in globals.css).
 */
export function PaperSurface() {
  return (
    <div className="paper-surface" aria-hidden="true">
      <span className="ps-tone" />
      <span className="ps-recess" />
      <span className="ps-pattern" />
      <span className="ps-emboss" />
      <span className="ps-leaf" />
      <span className="ps-petal" />
      <span className="ps-heart" />
      <span className="ps-foil" />
      <span className="ps-kline" />
      <span className="ps-line" />
      <span className="pb pb-t" />
      <span className="pb pb-b" />
      <span className="pb pb-l" />
      <span className="pb pb-r" />
      <span className="ps-sheen" />
      <span className="ps-relief" />
      <span className="ps-fibre" />
    </div>
  );
}

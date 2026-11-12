import { monogramFont, monogramStack } from "@/lib/monogram-fonts";

/**
 * The couple's monogram as a wedding crest, for the face of the invitation.
 *
 * Drawn the way a stationer would set one: a hairline double ring broken at
 * the top by a small lozenge, a laurel wreath rising from a knot at the
 * bottom up both sides, the initials in the couple's monogram face, and the
 * wedding date in small spaced numerals under a hairline rule. One quiet foil
 * throughout (deeper antique gold on light papers, brighter on dark), with no
 * bevels or drop shadows to make it look stuck on. The initials and date are
 * HTML text, not SVG, so Khmer shapes correctly. Printed in place: no draw-in.
 * Everything is computed, not random, so server and browser draw the same.
 */
export function MonogramCrest({
  text,
  groom,
  bride,
  font,
  date,
  className = "",
}: {
  text?: string;
  groom?: string;
  bride?: string;
  font?: string | null;
  /** Already formatted (e.g. "២៤ · ០៤ · ២០២៧"); omitted when empty. */
  date?: string;
  className?: string;
}) {
  const face = monogramFont(font);
  const letters = splitInitials(text?.trim() || initialsOf(groom, bride));
  // a script's capitals are drawn to flow together; a separator between them looks wrong
  const script = face.script === "latin" && !/cormorant|playfair/i.test(face.family);
  const gid = `mcg-${face.id}`;

  return (
    <div
      className={`mc ${face.script === "khmer" ? "mc-khmer" : script ? "mc-script" : "mc-serif"} ${className}`}
      role="img"
      aria-label={[letters.join(""), date].filter(Boolean).join(" · ")}
    >
      <svg className="mc-svg" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          {/* one light across the whole crest (user space): a gradient sized to each
              shape's own box collapses on a perfectly flat line, and the rule
              under the initials would not print */}
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0" style={{ stopColor: "var(--mc-0)" }} />
            <stop offset="0.25" style={{ stopColor: "var(--mc-1)" }} />
            <stop offset="0.42" style={{ stopColor: "var(--mc-2)" }} />
            <stop offset="0.6" style={{ stopColor: "var(--mc-3)" }} />
            <stop offset="0.78" style={{ stopColor: "var(--mc-4)" }} />
            <stop offset="1" style={{ stopColor: "var(--mc-0)" }} />
          </linearGradient>
        </defs>
        <g fill={`url(#${gid})`} stroke={`url(#${gid})`}>{ART}</g>
      </svg>

      <div className="mc-ini" aria-hidden="true">
        {letters.map((ch, i) => (
          <span key={i} className="mc-pair">
            {i > 0 && !script && <i className="mc-sep" />}
            <span className="mc-letter mc-foil" style={{ fontFamily: monogramStack(face), fontStyle: face.italic ? "italic" : undefined }}>
              {ch}
            </span>
          </span>
        ))}
      </div>
      {date && (
        <div className="mc-date mc-foil" aria-hidden="true">
          {date}
        </div>
      )}
    </div>
  );
}

/** Two initials as two items ("S&L", "S L", "វស" → [S, L] / [វ, ស]); anything else as one. */
function splitInitials(raw: string): string[] {
  const t = raw.trim();
  const amp = /^(.{1,2}?)\s*[&+·]\s*(.{1,2})$/u.exec(t);
  if (amp) return [amp[1], amp[2]];
  const sp = /^(\S{1,2})\s+(\S{1,2})$/u.exec(t);
  if (sp) return [sp[1], sp[2]];
  // a Khmer letter may carry marks (subscripts, vowels): split on base consonants
  const clusters = t.match(/[ក-ឳ][឴-៝‌‍]*(?:្[ក-ឳ][឴-៝]*)*|\S/gu) ?? [t];
  return clusters.length === 2 ? clusters : [t];
}

function initialsOf(groom?: string, bride?: string) {
  const first = (v?: string) => [...(v?.trim()?.split(/\s+/).pop() ?? "")][0] ?? "";
  return `${first(groom)}${first(bride)}` || "♥";
}

/* ── the drawing: computed once, the same everywhere ─────────────────────── */
const f = (n: number) => n.toFixed(2);
const at = (a: number, r: number): [number, number] => [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
function arc(r: number, a0: number, a1: number) {
  const [x0, y0] = at(a0, r);
  const [x1, y1] = at(a1, r);
  return `M${f(x0)} ${f(y0)}A${r} ${r} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 > a0 ? 1 : 0} ${f(x1)} ${f(y1)}`;
}
/** An almond leaf from its base, pointing `ang`, with a fine midrib. */
function leaf(x: number, y: number, ang: number, L: number, W: number, key: string) {
  const c = Math.cos(ang), s = Math.sin(ang), px = -s, py = c;
  const tip = [x + c * L, y + s * L], m1 = [x + c * L * 0.45 + px * W, y + s * L * 0.45 + py * W], m2 = [x + c * L * 0.45 - px * W, y + s * L * 0.45 - py * W];
  return [
    <path key={key} stroke="none" d={`M${f(x)} ${f(y)}Q${f(m1[0])} ${f(m1[1])} ${f(tip[0])} ${f(tip[1])}Q${f(m2[0])} ${f(m2[1])} ${f(x)} ${f(y)}Z`} />,
    <path key={`${key}v`} fill="none" strokeWidth={0.3} className="mc-vein" d={`M${f(x)} ${f(y)}L${f(x + c * L * 0.8)} ${f(y + s * L * 0.8)}`} />,
  ];
}
/** A laurel sprig rising from the bottom up one side of the ring. */
function sprig(dir: 1 | -1, r: number) {
  const a0 = Math.PI / 2 + dir * 0.1, a1 = Math.PI / 2 - dir * (Math.PI * 0.66);
  const grow = (a: number) => a - (dir * Math.PI) / 2;
  const out = [<path key={`st${dir}`} d={arc(r, a0, a1)} fill="none" strokeWidth={0.7} />];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.35) / n, size = 1 - t * 0.5;
    const ai = a0 + (a1 - a0) * t, ao = a0 + (a1 - a0) * Math.min(1, t + 0.035);
    const [xo, yo] = at(ao, r), [xi, yi] = at(ai, r);
    out.push(...leaf(xo, yo, grow(ao) + dir * 0.62, 12 * size, 3.3 * size, `o${dir}${i}`));
    out.push(...leaf(xi, yi, grow(ai) - dir * 0.62, 11 * size, 3 * size, `i${dir}${i}`));
  }
  const [tx, ty] = at(a1, r);
  out.push(...leaf(tx, ty, grow(a1), 8, 2.2, `t${dir}`));
  return out;
}
const TOP = -Math.PI / 2, GAP = 0.09;
const ART = (
  <>
    <path d={arc(94, TOP + GAP, TOP + 2 * Math.PI - GAP)} fill="none" strokeWidth={1.1} />
    <path d={arc(90.5, TOP + GAP * 1.1, TOP + 2 * Math.PI - GAP * 1.1)} fill="none" strokeWidth={0.45} />
    <path d="M100 2.6L103.2 6.2L100 9.8L96.8 6.2Z" stroke="none" />
    {[TOP + GAP * 1.9, TOP - GAP * 1.9].map((a, i) => {
      const [x, y] = at(a, 92.2);
      return <circle key={i} cx={f(x)} cy={f(y)} r={0.9} stroke="none" />;
    })}
    {sprig(1, 81)}
    {sprig(-1, 81)}
    <path d="M100 177.2L102.4 180.4L100 183.6L97.6 180.4Z" stroke="none" />
    <path d="M76 121H95M105 121H124" fill="none" strokeWidth={0.6} />
    <path d="M100 118.8L102.2 121L100 123.2L97.8 121Z" stroke="none" />
  </>
);

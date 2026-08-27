/**
 * Khmer ornament bands: a crowned centre motif, symmetric kbach vines, a
 * hairline rule punctuated with diamonds, and a corner cluster at each end.
 * Half is drawn, then mirrored about the centre, so every band is exactly
 * symmetric.
 */
const W = 1000, H = 190;
const RULE_Y = 176;
const f = (n) => Math.round(n * 2) / 2;

/* ── primitives ──────────────────────────────────────────────────────── */

function spiral({ cx, cy, a, b, t0, t1, rot = 0, steps = 18 }) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = t0 + (t1 - t0) * (i / steps);
    const r = a * Math.exp(b * t);
    pts.push([cx + r * Math.cos(t + rot), cy + r * Math.sin(t + rot)]);
  }
  return pts;
}

function smooth(pts) {
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
         `${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

/** Pointed Khmer leaf/flame, base at (x,y), tip `L` away along `ang`. */
function flame(x, y, ang, L, Wd, pinch = 0.72) {
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const P = (t, w) => [f(x + dx * L * t + nx * Wd * w), f(y + dy * L * t + ny * Wd * w)];
  const tip = [f(x + dx * L), f(y + dy * L)];
  const [a1, a2] = [P(0.16, 1), P(pinch, 0.62)];
  const [b1, b2] = [P(pinch, -0.62), P(0.16, -1)];
  return `M${f(x)},${f(y)}C${a1} ${a2} ${tip}C${b1} ${b2} ${f(x)},${f(y)}Z`.replace(/,(?=\d|-)/g, ",").replace(/(\d) (\d|-)/g, "$1 $2");
}

function leafPath(x, y, ang, L, Wd) {
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const P = (t, w) => [x + dx * L * t + nx * Wd * w, y + dy * L * t + ny * Wd * w];
  const [c1x, c1y] = P(0.22, 1), [c2x, c2y] = P(0.7, 0.8);
  const [c3x, c3y] = P(0.7, -0.55), [c4x, c4y] = P(0.22, -0.8);
  return `M${f(x)},${f(y)}C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(x + dx * L)},${f(y + dy * L)}` +
         `C${f(c3x)},${f(c3y)} ${f(c4x)},${f(c4y)} ${f(x)},${f(y)}Z`;
}

const op = (o) => (o >= 1 ? "" : ` opacity="${o}"`);

const el = {
  fill: (d, o = 1) => `<path d="${d}" fill="currentColor"${op(o)}/>`,
  line: (d, w = 1.2, o = 1) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"${op(o)}/>`,
  dot: (x, y, r, o = 1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="currentColor"${op(o)}/>`,
  diamond: (x, y, r, o = 1) => `<path d="M${f(x)},${f(y - r)}L${f(x + r)},${f(y)}L${f(x)},${f(y + r)}L${f(x - r)},${f(y)}Z" fill="currentColor"${op(o)}/>`,
};

/* ── centre motifs ───────────────────────────────────────────────────── */

const MOTIFS = {
  /** Layered lotus in bloom. */
  lotus(cx, base) {
    let s = "";
    const petal = (ang, L, Wd, o, from = 0) => {
      const x = cx + Math.cos(ang) * from, y = base + Math.sin(ang) * from;
      let out = el.fill(flame(x, y, ang, L, Wd), o);
      // a vein down the middle keeps the petals from merging into a fan
      out += el.line(`M${f(x)},${f(y)}L${f(x + Math.cos(ang) * L * 0.72)},${f(y + Math.sin(ang) * L * 0.72)}`, 1, o * 0.32);
      return out;
    };
    // outer ring of petals first, so the inner ones overlap them
    for (const [ang, L, Wd, o] of [
      [-0.24, 42, 15, 0.42], [-2.9, 42, 15, 0.42],
      [-0.52, 62, 20, 0.58], [-2.62, 62, 20, 0.58],
      [-0.84, 82, 24, 0.74], [-2.3, 82, 24, 0.74],
    ]) s += petal(ang, L, Wd, o, 6);
    s += petal(-1.18, 96, 26, 0.88, 3);
    s += petal(-1.96, 96, 26, 0.88, 3);
    s += petal(-Math.PI / 2, 112, 30, 0.97);
    s += el.fill(flame(cx, base - 6, -Math.PI / 2, 52, 13), 0.34);
    // calyx
    s += el.line(`M${cx - 46},${base - 2}Q${cx},${base + 14} ${cx + 46},${base - 2}`, 2, 0.85);
    s += el.line(`M${cx - 32},${base + 2}Q${cx},${base + 12} ${cx + 32},${base + 2}`, 1.1, 0.5);
    s += el.dot(cx, base - 100, 3, 0.9);
    return s;
  },

  /** Kbach flame finial — the pointed crown seen across the sheet. */
  flame(cx, base) {
    let s = "";
    // side leaves first
    for (const [ang, L, Wd, o] of [
      [-0.62, 52, 15, 0.5], [-2.52, 52, 15, 0.5],
      [-0.95, 78, 19, 0.68], [-2.19, 78, 19, 0.68],
      [-1.2, 104, 22, 0.85], [-1.94, 104, 22, 0.85],
    ]) s += el.fill(flame(cx, base - 4, ang, L, Wd), o);
    // the finial itself, layered
    s += el.fill(flame(cx, base, -Math.PI / 2, 150, 31, 0.78), 0.97);
    s += el.fill(flame(cx, base + 2, -Math.PI / 2, 112, 20, 0.78), 0.42);
    s += el.line(`M${cx},${base - 6}L${cx},${base - 128}`, 1.1, 0.3);
    // curls springing from the base
    s += el.line(smooth(spiral({ cx: cx - 46, cy: base - 20, a: 9, b: 0.2, t0: 0.2, t1: 4.8, rot: 2.4 })), 1.5, 0.78);
    s += el.line(smooth(spiral({ cx: cx + 46, cy: base - 20, a: 9, b: 0.2, t0: 0.2, t1: 4.8, rot: 0.75 })), 1.5, 0.78);
    // stepped base
    s += el.line(`M${cx - 40},${base - 2}Q${cx},${base + 12} ${cx + 40},${base - 2}`, 2, 0.85);
    s += el.diamond(cx, base + 12, 5.5, 0.9);
    s += el.dot(cx, base - 142, 2.6, 0.85);
    return s;
  },

  /** Angkor Wat silhouette. */
  angkor(cx, base) {
    const tower = (x, h, w, o) => {
      let t = "";
      const tiers = 5;
      for (let i = 0; i < tiers; i++) {
        const th = h / tiers, y = base - 18 - th * (i + 1);
        const tw = w * (1 - i * 0.15);
        t += `<path d="M${f(x - tw / 2)},${f(y + th)}L${f(x - tw / 2 + tw * 0.08)},${f(y)}L${f(x + tw / 2 - tw * 0.08)},${f(y)}L${f(x + tw / 2)},${f(y + th)}Z" fill="currentColor" opacity="${o}"/>`;
      }
      t += el.fill(flame(x, base - 18 - h, -Math.PI / 2, 22, 5), o);
      return t;
    };
    let s = "";
    s += tower(cx, 96, 40, 0.95);
    s += tower(cx - 68, 70, 32, 0.85) + tower(cx + 68, 70, 32, 0.85);
    s += tower(cx - 124, 52, 26, 0.7) + tower(cx + 124, 52, 26, 0.7);
    s += `<rect x="${f(cx - 152)}" y="${f(base - 20)}" width="304" height="9" fill="currentColor" opacity="0.9"/>`;
    s += `<rect x="${f(cx - 138)}" y="${f(base - 11)}" width="276" height="7" fill="currentColor" opacity="0.7"/>`;
    for (let i = -8; i <= 8; i++) {
      s += `<rect x="${f(cx + i * 17 - 2.5)}" y="${f(base - 34)}" width="5" height="14" fill="currentColor" opacity="0.45"/>`;
    }
    return s;
  },

  /** Dharma wheel rosette. */
  wheel(cx, base) {
    const cy = base - 62, R = 58;
    let s = "";
    s += el.line(`M${cx - R},${cy}a${R},${R} 0 1,0 ${R * 2},0a${R},${R} 0 1,0 ${-R * 2},0`, 2.2, 0.95);
    s += el.line(`M${cx - R + 9},${cy}a${R - 9},${R - 9} 0 1,0 ${(R - 9) * 2},0a${R - 9},${R - 9} 0 1,0 ${-(R - 9) * 2},0`, 1, 0.6);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      s += el.fill(flame(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, a, 34, 9), 0.8);
    }
    s += el.line(`M${cx - 14},${cy}a14,14 0 1,0 28,0a14,14 0 1,0 -28,0`, 1.4, 0.8);
    s += el.dot(cx, cy, 5, 0.9);
    s += el.fill(flame(cx, cy - R - 2, -Math.PI / 2, 30, 9), 0.85);
    s += el.fill(flame(cx, base, -Math.PI / 2, 26, 10), 0.6);
    return s;
  },
};

/* ── the half-band: vines and rule, drawn left of centre ─────────────── */

function halfBand() {
  let s = "";

  // principal arc, springing from behind the crown and sweeping outward
  s += el.line(smooth([[398, 148], [352, 126], [302, 116], [252, 120], [212, 136], [188, 158]]), 2.1, 0.95);
  s += el.line(smooth(spiral({ cx: 182, cy: 146, a: 13, b: 0.18, t0: 1.5, t1: 6.4, rot: 0 })), 1.7, 0.9);

  // counter-scroll running beneath it, the other way
  s += el.line(smooth([[394, 162], [348, 156], [300, 152], [256, 154], [222, 162]]), 1.3, 0.68);
  s += el.line(smooth(spiral({ cx: 214, cy: 154, a: 8, b: 0.2, t0: 1.2, t1: 5.4, rot: 0.4 })), 1.2, 0.62);

  // interior curls filling the arc
  s += el.line(smooth(spiral({ cx: 336, cy: 134, a: 8, b: 0.2, t0: 0.2, t1: 4.6, rot: 2.7 })), 1.2, 0.66);
  s += el.line(smooth(spiral({ cx: 268, cy: 132, a: 7, b: 0.2, t0: 0.5, t1: 4.4, rot: 1.5 })), 1.1, 0.58);
  s += el.line(smooth([[330, 140], [306, 146], [284, 144]]), 0.9, 0.45);

  // tendrils reaching up between the leaves
  s += el.line(smooth([[318, 122], [312, 104], [318, 90]]), 0.9, 0.5);
  s += el.line(smooth([[248, 126], [240, 110], [246, 98]]), 0.9, 0.45);

  // leaves, fanning up and outward
  s += el.fill(leafPath(352, 126, -1.95, 32, 10.5), 0.92);
  s += el.fill(leafPath(302, 116, -1.58, 38, 12), 0.96);
  s += el.fill(leafPath(252, 120, -1.22, 30, 9.5), 0.88);
  s += el.fill(leafPath(212, 136, -0.92, 24, 8), 0.74);
  s += el.fill(leafPath(378, 138, -2.3, 26, 8.5), 0.8);
  s += el.fill(leafPath(326, 138, -2.55, 21, 7), 0.52);
  s += el.fill(leafPath(276, 136, -2.75, 17, 6), 0.44);
  s += el.fill(leafPath(318, 90, -1.6, 15, 5), 0.6);
  s += el.fill(leafPath(246, 98, -1.5, 13, 4.5), 0.55);

  s += el.dot(302, 114, 3.2, 0.85);
  s += el.dot(352, 124, 2.6, 0.75);
  s += el.dot(182, 146, 2.8, 0.8);
  s += el.dot(214, 154, 2, 0.6);

  // hairline rule, punctuated with diamonds
  s += el.line(`M96,${RULE_Y}L392,${RULE_Y}`, 1.3, 0.85);
  s += el.diamond(404, RULE_Y, 5, 0.9);
  s += el.diamond(244, RULE_Y, 4, 0.68);
  s += el.diamond(84, RULE_Y, 4, 0.68);
  return s;
}

/* ── corner cluster, hugging the top-left of the card ───────────────── */

function cornerCluster() {
  let s = "";

  // the L: one arm along the top edge, one down the side, meeting at a rosette
  s += el.line(smooth([[16, 150], [15, 96], [20, 56], [34, 30], [58, 18], [96, 15], [140, 17]]), 2.1, 0.95);
  s += el.line(smooth([[26, 146], [25, 100], [31, 66], [46, 42], [70, 30], [104, 27]]), 1.1, 0.55);

  // curls at each end of the arm
  s += el.line(smooth(spiral({ cx: 150, cy: 28, a: 9, b: 0.19, t0: -1.4, t1: 4 })), 1.4, 0.85);
  s += el.line(smooth(spiral({ cx: 28, cy: 160, a: 9, b: 0.19, t0: 0.2, t1: 4.8, rot: 1.6 })), 1.4, 0.85);

  // an inner spray reaching into the card
  s += el.line(smooth([[40, 44], [66, 58], [88, 76], [102, 98]]), 1.3, 0.7);
  s += el.line(smooth(spiral({ cx: 104, cy: 106, a: 7, b: 0.2, t0: -0.6, t1: 4.2, rot: 1 })), 1.1, 0.6);
  s += el.line(smooth([[34, 74], [52, 88], [62, 106]]), 0.9, 0.45);

  // leaves, every one pointing inward
  s += el.fill(leafPath(58, 18, 1.15, 30, 10), 0.9);
  s += el.fill(leafPath(96, 15, 1.4, 26, 8.5), 0.82);
  s += el.fill(leafPath(20, 56, 0.35, 30, 10), 0.88);
  s += el.fill(leafPath(15, 96, 0.15, 25, 8.5), 0.75);
  s += el.fill(leafPath(66, 58, 0.72, 24, 8), 0.66);
  s += el.fill(leafPath(88, 76, 0.62, 19, 6.5), 0.5);
  s += el.fill(leafPath(34, 30, 0.78, 20, 7), 0.58);

  s += el.dot(140, 17, 2.6, 0.8);
  s += el.dot(16, 150, 2.6, 0.8);
  s += el.dot(58, 18, 2, 0.6);
  s += el.dot(20, 56, 2, 0.6);

  // the rosette where the two arms meet
  s += el.dot(21, 21, 3.2, 0.9);
  return s;
}

export function band(motif = "lotus") {
  const half = halfBand() + cornerCluster();
  const body =
    `<g>${half}</g>` +
    `<g transform="translate(${W} 0) scale(-1 1)">${half}</g>` +
    `<g>${MOTIFS[motif](W / 2, RULE_Y)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none">${body}</svg>`;
}

export const MOTIF_NAMES = Object.keys(MOTIFS);

/*
 * Regenerate the React component with:
 *   node scripts/emit-ornaments.mjs
 * which writes src/components/ui/OrnamentBand.tsx from the bands above.
 */

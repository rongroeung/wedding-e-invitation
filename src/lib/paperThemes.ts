/**
 * The papers, as data: five stationery suites, all from one art direction —
 * the couple's vintage flourish pack for the ornament, and drawn camellias,
 * small blossoms, flowering branches and vines (no lotus) for the flowers.
 * One record per paper in `paper-themes.json`, read by this module (the
 * page's CSS) and by `lib/appearance` (the names and the pickers), so a
 * paper's colours live in one place.
 *
 * Each paper is a clean sheet and a composition (`compose`: which drawings,
 * in which corners — scripts/stationery-art.py), with its colours.
 * `paperThemeCss()` turns the table into the custom properties the paper
 * layers read, plus:
 *
 *   --sync-env-*   the envelope in the paper's colours (used when the couple
 *                  keep "match the envelope to the paper" on);
 *   --room-*       the envelope's room as a deep, dim shade of the paper's own
 *                  hue, so the room, the envelope and the card read as one set;
 *   dark papers    the card's writing turned light (their --c-* colours).
 */
import collection from "./collection-art.json";
import { DARK_INK, DARK_METAL, PAPER_TONES } from "./paperTones";
import art from "./stationery-art.json";
import data from "./paper-themes.json";

export type PaperGroup = "khmer" | "relief" | "floral";

type Corner = "tl" | "tr" | "bl" | "br" | "tc" | "bc";
/**
 * One piece of artwork placed on the sheet (scripts/collection-art.py and
 * scripts/stationery-art.py). `src` is "<folder>/<name>"; a drawing in
 * plates (a scene) prints all its plates, a single shape prints on `plate`.
 */
type Placement = {
  src: string;
  corner: Corner;
  /** "a" | "b" | "c" | "crest" | "mark", or any CSS width. */
  size: string;
  plate?: "foil" | "line" | "relief" | "blind";
  /** Set beside a large corner ornament, along the foot, instead of in front of it. */
  beside?: boolean;
};

/** A band of repeating ornament along one edge, between the corners. */
type Band = {
  src: string;
  /** Thickness, as a share of the corner's width. */
  k: number;
  plate: "foil" | "line" | "relief" | "blind";
  /** Distance in from the inner rule, as a share of the corner's width. */
  gap?: number;
};

/**
 * A composed paper. A clean sheet; drawings set in chosen places; a frame of
 * corners and rules; optionally bands of repeating ornament along the edges,
 * a fine all-over pattern that steps back from the middle, and a recessed
 * channel. Every layer is a plate printed in one way (ink, foil, emboss, or
 * blind), so a design is a composition and a finish, not a tile and a tint.
 */
export type Compose = {
  art: Placement[];
  /** The engraving struck in metal rather than printed in ink. */
  lineMetal: boolean;
  /** Corner drawing: "<folder>/<name>" (its -tl/-tr/-bl/-br mirrors). */
  corner: string;
  /** How wide a corner prints. */
  cornerW?: string;
  /** The rules between the corners. */
  rule?: "double" | "single" | "none";
  /** The pack's medallion at the middle of the head and foot rules. */
  mid?: boolean;
  bands?: { t?: Band; b?: Band; l?: Band; r?: Band };
  pattern?: { src: string; size: string; plate: "foil" | "line" | "relief"; alpha: number; quiet?: number };
  /** A recessed channel inside the rules. */
  recess?: boolean;
  /** How the relief plate is lit: a shallow emboss, or a deeper carving. */
  depth?: "soft" | "deep";
};

export type PaperDef = {
  key: string;
  km: string;
  en: string;
  group: PaperGroup;
  pattern: string;
  dark: boolean;
  base: string;
  shade: string;
  light: string;
  metal: [string, string, string, string];
  petal: string;
  heart: string;
  leaf: string;
  size: number;
  foil: number;
  bloom: number;
  relief: number;
  fibre: number;
  centre: number;
  ink: string;
  /** The engraving's ink (flowers, leaves) and how strongly it prints. */
  line: string;
  lineAlpha: number;
  /** How strongly the kbach's gold line work prints. */
  kline: number;
  compose?: Compose;
};

export const PAPERS = data as unknown as PaperDef[];

export const PAPER_GROUPS: { key: PaperGroup; km: string; en: string }[] = [
  { key: "khmer", km: "ក្បាច់រចនាបុរាណខ្មែរ", en: "Traditional Khmer ornament" },
  { key: "relief", km: "ក្បាច់ចម្លាក់បុរាណខ្មែរ", en: "Khmer sculpture & relief" },
  { key: "floral", km: "ក្បាច់ផ្កា និងរុក្ខជាតិ", en: "Floral & botanical" },
];

/* ── colour arithmetic ─────────────────────────────────────────────────── */

function rgbOf(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  const n = Number.parseInt(v.length === 3 ? v.split("").map((c) => c + c).join("") : v.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hexOf([r, g, b]: number[]): string {
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("")}`;
}
function toHsl([r, g, b]: number[]): [number, number, number] {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h / 6, s, l];
}
function fromHsl(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return hexOf([f(0) * 255, f(8) * 255, f(4) * 255]);
}
export function shadeHex(hex: string, amount: number): string {
  const c = rgbOf(hex);
  return hexOf(c.map((v) => (amount < 0 ? v * (1 + amount) : v + (255 - v) * amount)));
}
const rgbTriplet = (hex: string) => rgbOf(hex).join(" ");

/**
 * The envelope's room for a paper: its own hue, taken deep and dim. A light
 * paper's hue carries little colour in its near-white, so the saturation is
 * given a floor; a near-neutral ivory becomes a warm cocoa, a blush a deep
 * rose, a sage a dark forest, a night paper stays night.
 */
export function roomOf(p: PaperDef): string[] {
  const [h0, s0] = toHsl(rgbOf(p.dark ? p.base : p.shade));
  // a light paper's room is warmed a touch (yellow-greens go olive in the
  // dark, a hair of red keeps them wood and cocoa)
  const h = p.dark ? h0 : (h0 - 0.018 + 1) % 1;
  const s = p.dark ? Math.min(0.6, Math.max(0.25, s0)) : Math.min(0.4, Math.max(0.2, s0 * 0.7));
  return [0.34, 0.25, 0.15, 0.085].map((l) => fromHsl(h, s, l));
}

/* ── the composed papers ──────────────────────────────────────────────── */

type Plate = "petal" | "leaf" | "heart" | "line" | "foil";
type Manifest = {
  scenes: Record<string, { w: number; h: number; plates: Record<string, Plate[]> }>;
  solids: Record<string, { w: number; h: number; variants: string[] }>;
};
const COLLECTION = collection as unknown as Manifest;
const STATIONERY = art as unknown as {
  ornaments: Record<string, [number, number] | ["pack", string]>;
  corners: { outer: number; inner: number };
};

/*
 * How large a drawing prints: a share of the card's width, held back by the
 * screen's height (a phone on its side never gets a spray taller than the
 * card) and by a ceiling on a wide desktop card.
 */
const SIZE: Record<string, string> = {
  a: "min(70%, 52dvh, 540px)",
  b: "min(48%, 38dvh, 400px)",
  c: "min(38%, 30dvh, 300px)",
  crest: "min(46%, 28dvh, 330px)",
  wide: "min(66%, 30dvh, 480px)",
  mark: "min(16%, 10dvh, 96px)",
};
const sizeOf = (s: string) => SIZE[s] ?? s;

/*
 * Where each piece sits: inside the rules (the rule is the line a spray
 * grows from); a hanging branch below the upper corner ornament; a crest
 * centred in the head, a mark centred on the foot.
 */
function at(c: Corner, beside = false): string {
  const top = "calc(var(--bt-ch) * 0.62)";
  const x = beside ? "calc(var(--corner-w, 100px) * 0.72)" : "var(--bt-in)";
  switch (c) {
    case "bl":
      return `left ${x} bottom var(--bt-in)`;
    case "br":
      return `right ${x} bottom var(--bt-in)`;
    case "tl":
      return `left ${x} top ${top}`;
    case "tr":
      return `right ${x} top ${top}`;
    case "tc":
      return "center top calc(var(--bt-in) + var(--corner-w, 100px) * 0.06)";
    default:
      return "center bottom calc(var(--bt-in) + var(--corner-w, 100px) * 0.06)";
  }
}

/** The files a placement prints on one plate (none where it has nothing there). */
function filesOf(pl: Placement, plate: Plate | "relief" | "blind"): string[] {
  const [dir, name] = pl.src.split("/");
  const sc = COLLECTION.scenes[name];
  const fills: Plate[] = ["petal", "leaf", "heart"];
  if (dir === "collection" && sc) {
    const have = sc.plates[pl.corner] ?? [];
    const file = (q: Plate) => `/art/collection/${name}-${pl.corner}-${q}.svg`;
    // a drawing carved or pressed rather than printed: its washes become the
    // carved shapes; its engraving still prints
    if (pl.plate === "relief" || pl.plate === "blind") {
      if (plate === pl.plate) return fills.filter((q) => have.includes(q)).map(file);
      return plate === "line" && have.includes("line") && pl.plate === "relief" ? [file("line")] : [];
    }
    return have.includes(plate as Plate) ? [file(plate as Plate)] : [];
  }
  // a single shape: printed on its own plate, in the variant for its place
  if ((pl.plate ?? "foil") !== plate) return [];
  const variants = COLLECTION.solids[name]?.variants ?? [""];
  const v = pl.corner === "bc" && variants.includes("flip") ? "-flip" : variants.includes(pl.corner) ? `-${pl.corner}` : "";
  return [`/art/${dir}/${name}${v}.svg`];
}

function layers(list: Placement[], plates: (Plate | "relief" | "blind")[]): string {
  const out: string[] = [];
  for (const pl of list) {
    for (const plate of plates) {
      for (const f of filesOf(pl, plate)) out.push(`url(${f}) ${at(pl.corner, pl.beside)} / ${sizeOf(pl.size)} no-repeat`);
    }
  }
  // nothing on this plate: an empty mask (not "none", which would show the
  // plate's whole colour across the sheet)
  return out.length ? out.join(",") : "linear-gradient(transparent, transparent)";
}

const metalRamp = (deg: number) =>
  `linear-gradient(${deg}deg,var(--pp-metal-0) 0%,var(--pp-metal-1) 18%,var(--pp-metal-2) 34%,var(--pp-metal-1) 50%,` +
  `var(--pp-metal-3) 66%,var(--pp-metal-1) 82%,var(--pp-metal-0) 100%)`;

/* How each kind of plate is painted. */
const PAINT = {
  foil: metalRamp(125),
  line: "var(--pc-line-paint)",
  relief: "var(--pc-stone)",
  blind: "rgb(60 40 20 / 0.05)",
};
const LIT = {
  soft: "drop-shadow(-0.7px -0.7px 0 rgb(255 255 255 / 0.85)) drop-shadow(0.8px 1px 0.4px rgb(70 48 24 / 0.28))",
  deep: "drop-shadow(-1px -1px 0 rgb(255 255 255 / 0.9)) drop-shadow(1.2px 1.6px 0.8px rgb(60 40 20 / 0.36)) drop-shadow(0 0 0.4px rgb(60 40 20 / 0.2))",
  blind: "drop-shadow(0.8px 0.8px 0 rgb(255 255 255 / 0.75)) drop-shadow(-0.6px -0.6px 0 rgb(60 40 20 / 0.24))",
};
const DARK_LIT = "drop-shadow(-0.6px -0.6px 0 rgb(255 236 200 / 0.18)) drop-shadow(0.9px 1.1px 0.5px rgb(0 0 0 / 0.45))";

function bandVars(edge: "t" | "b" | "l" | "r", b: Band | undefined): string {
  if (!b) return `--pb-${edge}-on:none;`;
  const [dir, name] = b.src.split("/");
  const vertical = edge === "l" || edge === "r";
  const solids = COLLECTION.solids[name];
  const v = vertical ? "" : edge === "b" && solids?.variants.includes("b") ? "-b" : solids?.variants.includes("t") ? "-t" : "";
  const file = `/art/${dir}/${name}${v}.svg`;
  // lit through variables, so a dark paper colour chosen over the design relights it
  const filter = b.plate === "relief" ? "var(--lit-soft)" : b.plate === "blind" ? "var(--lit-blind)" : "none";
  return (
    `--pb-${edge}-on:block;--pb-${edge}-m:url(${file});--pb-${edge}-k:${b.k};--pb-${edge}-gap:${b.gap ?? 0.04};` +
    `--pb-${edge}-paint:${PAINT[b.plate]};--pb-${edge}-f:${filter};`
  );
}

function composeCss(p: PaperDef, sel: string): string {
  const c = p.compose!;
  const [cdir, cname] = c.corner.split("/");
  const cornerSrc = (k: string) => `url(/art/${cdir}/${cname}-${k}.svg)`;
  const rule = c.rule ?? "double";
  const single = cname.startsWith("corner-single");
  const pt = c.pattern;
  const relief = c.art.filter((a) => a.plate === "relief");
  const blind = c.art.filter((a) => a.plate === "blind");
  // The placements read the corner's measured size (--bt-in, --bt-ch), which
  // lives on the card's sheet, so they are declared there and not on <html>:
  // a custom property is resolved where it is declared.
  return (
    `html${sel} .card-sheet{` +
    `--pc-petal:${layers(c.art, ["petal"])};--pc-leaf:${layers(c.art, ["leaf"])};--pc-heart:${layers(c.art, ["heart"])};` +
    `--pc-line:${layers(c.art, ["line"])};--pc-foil:${layers(c.art, ["foil"])};` +
    `--pc-sheen:${layers(c.art, c.lineMetal ? ["foil", "line"] : ["foil"])};` +
    `--pc-relief:${layers(relief, ["relief"])};--pc-relief-on:${relief.length ? "block" : "none"};` +
    `--pc-blind:${layers(blind, ["blind"])};--pc-blind-on:${blind.length ? "block" : "none"};` +
    `}` +
    `html${sel}{` +
    `--pc-line-paint:${c.lineMetal ? metalRamp(118) : p.line};` +
    `--pc-lit-light:${LIT[c.depth ?? "soft"]};` +
    // the frame: corners, and the rules between them
    `--bt-m-tl:${cornerSrc("tl")};--bt-m-tr:${cornerSrc("tr")};--bt-m-bl:${cornerSrc("bl")};--bt-m-br:${cornerSrc("br")};` +
    `--bt-cw:${c.cornerW ?? "min(24%, 16dvh, 160px)"};--bt-ar:1;--bt-arn:1;--bt-paint:${metalRamp(125)};` +
    (single
      ? `--bt-ro:0.065;--bt-ri:0.065;--bt-inr:0.085;`
      : `--bt-ro:${STATIONERY.corners.outer};--bt-ri:${STATIONERY.corners.inner};--bt-inr:${STATIONERY.corners.inner};`) +
    // bands run up to the corner ornament, or nearly to the corner where it is only the rules
    `--pb-end:${cname.startsWith("corner-plain") ? 0.3 : 0.92};` +
    `--bt-wo-k:${rule === "none" ? 0 : 1};--bt-wi-k:${rule === "double" ? 1 : 0};` +
    `--bt-mid:${c.mid ? "block" : "none"};--bt-gap:${c.mid ? "1" : "0"};` +
    bandVars("t", c.bands?.t) +
    bandVars("b", c.bands?.b) +
    bandVars("l", c.bands?.l) +
    bandVars("r", c.bands?.r) +
    (pt
      ? `--pt-on:block;--pt-m:url(/art/${pt.src}.svg);--pt-size:${pt.size};--pt-paint:${PAINT[pt.plate]};--pt-a:${pt.alpha};` +
        `--pt-quiet:${pt.quiet ?? 0.15};--pt-f:${pt.plate === "relief" ? "var(--lit-soft)" : "none"};`
      : `--pt-on:none;`) +
    `--rc-on:${c.recess ? "block" : "none"};` +
    `}` +
    // on a dark paper an ink engraving prints in light ink instead
    (c.lineMetal ? "" : `html${sel}[data-paper-dark]{--pc-line-paint:${DARK_INK}}`) +
    clearOfBands(c, sel)
  );
}

/*
 * The words keep clear of the bands. Head and foot bands: the cover, which
 * rises into the frame's bands on a large sheet (CardShell, --band-keep),
 * stops short of them. Side bands: the invitation's text is held in from
 * them (less the padding its sections already have).
 */
function clearOfBands(c: Compose, sel: string): string {
  const b = c.bands ?? {};
  const inr = c.corner.includes("corner-single") || c.corner.includes("corner-plain-single") ? 0.085 : STATIONERY.corners.inner;
  const reach = (x?: Band) => (x ? inr + (x.gap ?? 0.04) + x.k + 0.05 : 0);
  let css = "";
  const keep = Math.max(reach(b.t), reach(b.b));
  if (keep) css += `html${sel} .card-sheet{--band-keep:${Math.max(0.3, keep).toFixed(3)}!important}`;
  const side = Math.max(reach(b.l), reach(b.r));
  if (side) {
    css += `html${sel} .frame-safe{padding-inline:max(0px, calc(var(--corner-w, 100px) * ${side.toFixed(3)} + 4px - 1rem))}`;
  }
  return css;
}

/* ── the stylesheet ────────────────────────────────────────────────────── */

export function paperThemeCss(): string {
  const out: string[] = [];
  for (const p of PAPERS) {
    const sel = `[data-paper-theme="${p.key}"]`;
    const t = (layer: string) => (p.compose ? "none" : `url(/paper/${p.pattern}-${layer}.webp)`);
    const [m0, m1, m2, m3] = p.metal;
    const room = roomOf(p);
    const env = p.dark ? shadeHex(p.base, 0.1) : p.base;
    out.push(
      `${sel}{` +
        `--pp-base:${p.base};--pp-shade:${p.shade};--pp-light:${p.light};` +
        `--pp-metal-0:${m0};--pp-metal-1:${m1};--pp-metal-2:${m2};--pp-metal-3:${m3};` +
        `--pp-petal:${p.petal};--pp-heart:${p.heart};--pp-leaf:${p.leaf};` +
        `--pp-relief-img:${t("relief")};--pp-foil-img:${t("foil")};--pp-kline-img:${t("kline")};--pp-line-img:${t("line")};` +
        `--pp-line:${p.line};--pp-line-a:${p.lineAlpha};--pp-kline:${p.kline};--pp-petal-img:${t("petal")};--pp-heart-img:${t("heart")};--pp-leaf-img:${t("leaf")};` +
        `--pp-size:${p.size}px;--pp-foil:${p.foil};--pp-bloom:${p.bloom};--pp-relief:${p.relief};--pp-fibre:${p.fibre};--pp-centre:${p.centre};` +
        // a dark paper's envelope is lifted a little, so it stands off its room
        `--sync-env-paper:${env};--sync-env-paper-shade:${shadeHex(env, -0.07)};--sync-env-paper-deep:${shadeHex(env, -0.18)};` +
        `--sync-env-ink:${p.ink};--sync-env-gold:${m1};--sync-env-gold-light:${m2};--sync-env-gold-deep:${m0};` +
        `--sync-env-seal:${m3};--sync-env-seal-ink:${shadeHex(m2, 0.4)};` +
        `--room-0:${room[0]};--room-1:${room[1]};--room-2:${room[2]};--room-3:${room[3]};` +
        `}`,
    );
    out.push(`@media (min-width:900px){${sel}{--pp-size:${Math.round(p.size * 1.2)}px}}`);
    if (p.compose) out.push(composeCss(p, sel));
    if (p.dark) {
      const bg = rgbOf(p.base);
      // more specific than the shared dark-paper rule in globals.css
      const lift = (k: number) => rgbTriplet(shadeHex(p.base, k));
      out.push(
        `html${sel}[data-paper-dark] .card-stock{--c-text:${p.ink};--c-text-rgb:${rgbTriplet(p.ink)};--c-bg:${p.base};--c-bg-rgb:${bg.join(" ")};` +
          `--c-cream-rgb:${lift(0.12)};--c-beige-rgb:${lift(0.22)}}`,
      );
    }
  }
  out.push(LIGHTING);
  out.push(toneCss());
  // what every composed paper shares: its layers read the placements above
  const composed = PAPERS.filter((p) => p.compose).map((p) => `html[data-paper-theme="${p.key}"]`);
  if (composed.length) {
    const C = `:is(${composed.join(",")})`;
    out.push(COMPOSED_CSS.replaceAll("$C", C));
  }
  return out.join("\n");
}

/*
 * How carved and pressed shapes are lit, and the tone of carved stone. Live
 * variables, so a paper colour chosen over a design (paperTones) relights
 * them: a light paper is lit from the upper left with a soft shade below; a
 * dark paper with a faint warm highlight and a deeper shade.
 */
const LIGHTING =
  `html{--pc-stone:color-mix(in srgb,var(--pp-base) 93%,#5a4228);--pc-lit:var(--pc-lit-light,${LIT.soft});` +
  `--lit-soft:${LIT.soft};--lit-blind:${LIT.blind}}` +
  `html[data-paper-dark]{--pc-stone:color-mix(in srgb,var(--pp-base) 86%,#ffffff);--pc-lit:${DARK_LIT};--lit-soft:${DARK_LIT};` +
  `--lit-blind:drop-shadow(0.8px 0.8px 0 rgb(0 0 0 / 0.35)) drop-shadow(-0.6px -0.6px 0 rgb(255 236 200 / 0.14))}`;

/*
 * The paper colours (paperTones): each replaces the paper's tone and shading,
 * the matched envelope and the room, and — on a dark colour — the gold and
 * the card's writing. More specific than a design's own rule (html + an
 * attribute), and written after it.
 */
function toneCss(): string {
  return PAPER_TONES.map((t) => {
    const sel = `html[data-paper-tone="${t.key}"]`;
    const shade = shadeHex(t.base, t.dark ? -0.42 : -0.075);
    const light = t.dark ? "rgb(255 222 200 / 0.1)" : "rgb(255 253 247 / 0.85)";
    const env = t.dark ? shadeHex(t.base, 0.1) : t.base;
    const room = roomOf({ dark: t.dark, base: t.base, shade } as PaperDef);
    let css =
      `${sel}{--pp-base:${t.base};--pp-shade:${shade};--pp-light:${light};` +
      `--sync-env-paper:${env};--sync-env-paper-shade:${shadeHex(env, -0.07)};--sync-env-paper-deep:${shadeHex(env, -0.18)};` +
      (t.dark ? `--sync-env-ink:${DARK_INK};` : "") +
      `--room-0:${room[0]};--room-1:${room[1]};--room-2:${room[2]};--room-3:${room[3]};` +
      (t.dark
        ? `--pp-metal-0:${DARK_METAL[0]};--pp-metal-1:${DARK_METAL[1]};--pp-metal-2:${DARK_METAL[2]};--pp-metal-3:${DARK_METAL[3]};`
        : "") +
      `}`;
    if (t.dark) {
      const lift = (k: number) => rgbTriplet(shadeHex(t.base, k));
      css +=
        `${sel}[data-paper-dark] .card-stock{--c-text:${DARK_INK};--c-text-rgb:${rgbTriplet(DARK_INK)};` +
        `--c-bg:${t.base};--c-bg-rgb:${rgbTriplet(t.base)};--c-cream-rgb:${lift(0.12)};--c-beige-rgb:${lift(0.22)}}`;
    }
    return css;
  }).join("\n");
}

/* The rules every composed paper shares ($C is the list of them). */
const COMPOSED_CSS = `
$C .ps-petal{-webkit-mask:var(--pc-petal);mask:var(--pc-petal)}
$C .ps-leaf{-webkit-mask:var(--pc-leaf);mask:var(--pc-leaf)}
$C .ps-heart{-webkit-mask:var(--pc-heart);mask:var(--pc-heart)}
$C .ps-line{background:var(--pc-line-paint);-webkit-mask:var(--pc-line);mask:var(--pc-line)}
$C .ps-foil{-webkit-mask:var(--pc-foil);mask:var(--pc-foil)}
$C .ps-sheen{-webkit-mask:var(--pc-sheen);mask:var(--pc-sheen)}
$C .ps-kline{display:none}
$C .frame-edge.has-bt > :not(.bt-frame){display:none!important}
$C .frame-edge.has-bt > .bt-frame{display:block}
$C .bt-border{display:block}
$C .frame-side-rule{display:none}
$C .candle-glow{display:none}
$C .stage-near .stage-bokeh{display:none}
$C .section-glow{opacity:0.4}
$C .ps-relief{display:var(--pc-blind-on);opacity:1;mix-blend-mode:normal;background:none;-webkit-mask:none;mask:none;filter:var(--lit-blind)}
$C .ps-relief::before{content:"";position:absolute;inset:0;background:rgb(60 40 20 / 0.045);-webkit-mask:var(--pc-blind);mask:var(--pc-blind);-webkit-mask-composite:source-over;mask-composite:add}
$C .ps-petal,$C .ps-leaf,$C .ps-heart,$C .ps-line,$C .ps-foil,$C .ps-sheen{-webkit-mask-composite:source-over;mask-composite:add}
`;

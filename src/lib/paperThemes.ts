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
import art from "./stationery-art.json";
import data from "./paper-themes.json";

export type PaperGroup = "stationery";

/** One drawing placed in one corner (scripts/stationery-art.py). */
type Placement = {
  comp: string;
  corner: "tl" | "tr" | "bl" | "br";
  size: "a" | "b" | "c";
  /** Set beside a large corner ornament, along the foot, instead of in front of it. */
  beside?: boolean;
};

/**
 * A composed paper — one of the stationery suites. Instead of a repeating
 * tile, a few drawings are printed into chosen corners of a clean sheet,
 * with the suite's own frame corners and double rule, crest and dividers.
 */
export type Compose = {
  /** Printed in colour: wash plates, the engraving, and the foil accents. */
  art: Placement[];
  /** Printed blind: pressed into the sheet with no ink. */
  blind?: Placement[];
  /** The engraving struck in metal rather than printed in ink. */
  lineMetal: boolean;
  /**
   * The frame corners: the pack's acanthus (or a larger setting of it) on
   * the double rule, or a lighter corner of a camellia and flowering sprigs.
   */
  corner: "acanthus" | "acanthus-grand" | "floral";
  /** The pack's medallion at the middle of the head and foot rules. */
  mid?: boolean;
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

export const PAPERS = data as PaperDef[];

export const PAPER_GROUPS: { key: PaperGroup; km: string; en: string }[] = [
  { key: "stationery", km: "ក្រដាសលិខិតមង្គល", en: "Wedding stationery" },
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

/* ── the stationery suites ────────────────────────────────────────────── */

type Plate = "petal" | "leaf" | "heart" | "line" | "foil";
const ART = art as unknown as {
  compositions: Record<string, { plates: Record<string, Plate[]> }>;
  ornaments: Record<string, [number, number] | ["pack", string]>;
  corners: { outer: number; inner: number; outerW: number; innerW: number };
};
const ART_DIR = "/art/stationery";

/*
 * How large each drawing prints: a share of the card's width, held back by
 * the screen's height (so a phone on its side does not get a spray taller
 * than the card), and by a ceiling on a wide desktop card.
 */
const SIZE = {
  a: "min(70%, 52dvh, 540px)",
  b: "min(48%, 38dvh, 400px)",
  c: "min(38%, 30dvh, 300px)",
};

/*
 * Where each drawing sits: inside the double rule, so the rule is the line a
 * spray grows from. A hanging branch starts below the upper corner ornament
 * rather than across it.
 */
function at(c: Placement["corner"], beside = false): string {
  const top = "calc(var(--bt-ch) * 0.62)";
  const x = beside ? "calc(var(--corner-w, 100px) * 0.72)" : "var(--bt-in)";
  switch (c) {
    case "bl":
      return `left ${x} bottom var(--bt-in)`;
    case "br":
      return `right ${x} bottom var(--bt-in)`;
    case "tl":
      return `left var(--bt-in) top ${top}`;
    default:
      return `right var(--bt-in) top ${top}`;
  }
}

function layers(list: Placement[], plates: Plate[]): string {
  const out: string[] = [];
  for (const pl of list) {
    const have = ART.compositions[pl.comp]?.plates[pl.corner] ?? [];
    for (const plate of plates) {
      if (have.includes(plate)) {
        out.push(`url(${ART_DIR}/${pl.comp}-${pl.corner}-${plate}.svg) ${at(pl.corner, pl.beside)} / ${SIZE[pl.size]} no-repeat`);
      }
    }
  }
  return out.length ? out.join(",") : "none";
}

const metalRamp = (deg: number) =>
  `linear-gradient(${deg}deg,var(--pp-metal-0) 0%,var(--pp-metal-1) 18%,var(--pp-metal-2) 34%,var(--pp-metal-1) 50%,` +
  `var(--pp-metal-3) 66%,var(--pp-metal-1) 82%,var(--pp-metal-0) 100%)`;

/**
 * The suites' crest and four dividers, by ornament role (see lib/designKit):
 * the crest (a camellia over the pack's scroll), a double rule with the
 * pack's rule ends, a flowering branch, the pack's symmetrical scroll, and
 * the pack's long rule with flowering sprigs for the major sections.
 */
const SUITE_ORNAMENTS: Record<string, [string, number]> = {
  crest: ["crest", 1],
  title: ["divider-branch", 1.3],
  "title-couple": ["divider-scroll", 1],
  "title-program": ["divider-double", 1.5],
  "title-venue": ["divider-branch", 1.3],
  rule: ["divider-grand", 1],
  star: ["divider-double", 1],
  medallion: ["mark-camellia", 0.4],
  fleuron: ["mark-blossom", 0.5],
  wing: ["mark-blossom", 0.55],
  share: ["divider-branch", 1.2],
  rosette: ["mark-blossom", 0.8],
  mark: ["mark-camellia", 0.6],
};

function ornamentVars(): string {
  return Object.entries(SUITE_ORNAMENTS)
    .map(([role, [file, scale]]) => {
      const o = ART.ornaments[file];
      // one of the pack's own pieces, used as drawn
      const [src, w, h] =
        o[0] === "pack"
          ? [`/kit/flourish/${o[1]}.svg`, ...PACK_SIZES[o[1] as string]]
          : [`${ART_DIR}/${file}.svg`, o[0], o[1]];
      return `--orn-${role}:url(${src});--orn-${role}-ar:${w} / ${h};--orn-${role}-scale:${scale};`;
    })
    .join("");
}
const PACK_SIZES: Record<string, [number, number]> = { "scroll-diamond": [292.4, 93.7], medallion: [149.2, 79.7] };

/** Corner drawings: how wide each prints. */
const CORNER_WIDTH: Record<Compose["corner"], string> = {
  acanthus: "min(24%, 16dvh, 160px)",
  "acanthus-grand": "min(30%, 16dvh, 210px)",
  floral: "min(24%, 16dvh, 160px)",
};

function composeCss(p: PaperDef, sel: string): string {
  const c = p.compose!;
  const file = c.corner === "acanthus-grand" ? "acanthus" : c.corner;
  const cornerSrc = (k: string) => `url(${ART_DIR}/corner-${file}-${k}.svg)`;
  const blind = c.blind ?? [];
  const fills: Plate[] = ["petal", "leaf", "heart"];
  // The placements read the corner's measured size (--bt-in, --bt-ch), which
  // lives on the card's sheet, so they are declared there and not on <html>:
  // a custom property is resolved where it is declared.
  return (
    `html${sel} .card-sheet{` +
    `--pc-petal:${layers(c.art, ["petal"])};--pc-leaf:${layers(c.art, ["leaf"])};--pc-heart:${layers(c.art, ["heart"])};` +
    `--pc-line:${layers(c.art, ["line"])};--pc-foil:${layers(c.art, ["foil"])};` +
    `--pc-sheen:${layers(c.art, c.lineMetal ? ["foil", "line"] : ["foil"])};` +
    `--pc-line-paint:${c.lineMetal ? metalRamp(118) : p.line};` +
    `--pc-blind:${layers(blind, fills)};` +
    `--pc-blind-on:${blind.length ? "block" : "none"};}` +
    `html${sel}{` +
    // the frame: corners, the double rule between them, and (for the
    // vintage suite) the pack's medallion at the middle of the head and foot
    `--bt-m-tl:${cornerSrc("tl")};--bt-m-tr:${cornerSrc("tr")};--bt-m-bl:${cornerSrc("bl")};--bt-m-br:${cornerSrc("br")};` +
    `--bt-cw:${CORNER_WIDTH[c.corner]};--bt-ar:1;--bt-arn:1;--bt-paint:${metalRamp(125)};` +
    `--bt-ro:${ART.corners.outer};--bt-ri:${ART.corners.inner};--bt-inr:${ART.corners.inner};` +
    `--bt-mid:${c.mid ? "block" : "none"};--bt-gap:${c.mid ? "1" : "0"};` +
    ornamentVars() +
    `}`
  );
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
  // what every composed paper shares: its layers read the placements above
  const composed = PAPERS.filter((p) => p.compose).map((p) => `html[data-paper-theme="${p.key}"]`);
  if (composed.length) {
    const C = `:is(${composed.join(",")})`;
    out.push(COMPOSED_CSS.replaceAll("$C", C));
  }
  return out.join("\n");
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
$C .ps-relief{display:var(--pc-blind-on);opacity:1;mix-blend-mode:normal;background:none;-webkit-mask:none;mask:none;filter:drop-shadow(0.8px 0.8px 0 rgb(255 255 255 / 0.75)) drop-shadow(-0.6px -0.6px 0 rgb(60 40 20 / 0.24))}
$C .ps-relief::before{content:"";position:absolute;inset:0;background:rgb(60 40 20 / 0.045);-webkit-mask:var(--pc-blind);mask:var(--pc-blind);-webkit-mask-composite:source-over;mask-composite:add}
$C .ps-petal,$C .ps-leaf,$C .ps-heart,$C .ps-line,$C .ps-foil,$C .ps-sheen{-webkit-mask-composite:source-over;mask-composite:add}
`;

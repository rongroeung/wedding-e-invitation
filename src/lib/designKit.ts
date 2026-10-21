/**
 * Design kits: one coordinated set of ornaments for the whole invitation.
 *
 * A kit decides every decorative element at once — the crest above the
 * heading, the scroll under each section title, the dividers, the small
 * accents, the mark pressed into the wax seal and what is printed on the
 * envelope's flap — so they are always from the same hand. The card's frame
 * is chosen separately (`frameMotif`), but picking a kit in the dashboard also
 * moves the frame to the kit's own.
 *
 * Components never ask which kit is active. They ask for an ornament by its
 * *role* (`<Flourish role="title" />`), and `ThemeStyle` publishes, per role,
 * the file to draw and its proportions as custom properties. Elements that
 * only one kit has (the flap medallion, the scroll at the start of the name
 * mark, each kit's seal stamp) carry a `kit-only-*` class, and the other kits
 * hide them. One render, any kit, no prop threaded through the page.
 */

export const ORNAMENT_ROLES = [
  "crest",
  "title",
  "title-couple",
  "title-program",
  "title-venue",
  "rule",
  "star",
  "medallion",
  "fleuron",
  "wing",
  "share",
  "rosette",
  "mark",
] as const;
export type OrnamentRole = (typeof ORNAMENT_ROLES)[number];

/** A file, its proportions, and how much bigger or smaller than the default kit it is drawn as a divider. */
type Art = { src: string; w: number; h: number; scale?: number };

export type DesignKit = {
  key: DesignKitKey;
  /** Shown in the dashboard. */
  label: string;
  note: string;
  /** The frame the dashboard switches to when this kit is picked. */
  frame: string;
  ornaments: Record<OrnamentRole, Art>;
};

const F = (name: string, w: number, h: number): Art => ({ src: `/kit/flourish/${name}.svg`, w, h });

/** The couple's vintage flourish pack (`design/vintage-flourish/`). */
const VINTAGE: Record<OrnamentRole, Art> = {
  crest: F("crest", 663.9, 216.7),
  title: F("scroll-diamond", 292.4, 93.7),
  "title-couple": F("scroll-twin", 246.8, 98.7),
  "title-program": F("scroll-bow", 333.5, 96.5),
  "title-venue": F("scroll-knot", 257.7, 82.8),
  rule: F("rule", 908.2, 79.7),
  star: F("star-rule", 468.3, 127.5),
  medallion: F("medallion", 149.2, 79.7),
  fleuron: F("fleuron", 113.4, 66.0),
  wing: F("wing", 94.8, 73.4),
  share: F("scroll-twin", 246.8, 98.7),
  rosette: F("rosette-c", 75.1, 75.0),
  mark: F("rosette-d", 65.8, 66.2),
};

/** The invitation's original Khmer gold set: the lotus crown, lotus and rule. */
/* Upright where the flourish crest is wide, so it is drawn at half the width. */
const CREST: Art = { src: "/kit/crest.svg", w: 220, h: 150, scale: 0.5 };
const RULE: Art = { src: "/kit/divider.svg", w: 320, h: 50 };
const LOTUS: Art = { src: "/kit/lotus.svg", w: 120, h: 120 };
/* The lotus is square, so where it stands in for a wide scroll it is drawn small. */
const LOTUS_SMALL: Art = { ...LOTUS, scale: 0.4 };
const KHMER: Record<OrnamentRole, Art> = {
  crest: CREST,
  title: RULE,
  "title-couple": RULE,
  "title-program": RULE,
  "title-venue": RULE,
  rule: RULE,
  star: RULE,
  medallion: { ...RULE, scale: 1.7 },
  fleuron: LOTUS_SMALL,
  wing: { ...LOTUS, scale: 0.6 },
  share: RULE,
  rosette: LOTUS,
  mark: LOTUS,
};

import generated from "./design-kits.json";

/**
 * The eighteen newer kits, drawn as vector art by scripts/design-kits.py
 * (Khmer kbach sets, flower sets, and classical ones), with every role's file
 * and proportions in design-kits.json. They carry no `kit-only-*` artwork of
 * their own: the wax seal and the envelope flap draw their `mark` and
 * `medallion` through the `kit-generated` elements instead.
 */
const GENERATED = Object.fromEntries(
  Object.entries(generated as Record<string, { label: string; note: string; frame: string; ornaments: Record<OrnamentRole, Art> }>).map(
    ([key, k]) => [key, { key, label: k.label, note: k.note, frame: k.frame, ornaments: k.ornaments }],
  ),
);

const LEGACY = {
  "vintage-flourish": {
    key: "vintage-flourish",
    label: "ក្បាច់វល្លិបុរាណ",
    note: "ក្បាច់វល្លិមាសបុរាណ — ស៊ុមជ្រុង ក្បាច់កំពូល ខ្សែខណ្ឌ ត្រាក្រមួន និងក្បាច់លើស្រោមសំបុត្រ",
    frame: "flourish",
    ornaments: VINTAGE,
  },
  "khmer-gold": {
    key: "khmer-gold",
    label: "ក្បាច់ខ្មែរមាស",
    note: "ក្បាច់ខ្មែរ ផ្កាឈូក និងមកុដមាស ជាមួយស៊ុមក្បាច់ខ្មែរ",
    frame: "kbach",
    ornaments: KHMER,
  },
} satisfies Record<string, Omit<DesignKit, "key"> & { key: string }>;

/*
 * Kits built on the lotus are no longer offered (the couple asked for no lotus
 * anywhere). A wedding still set to one is shown the default kit instead
 * (`designKitOf`); the original Khmer kit stays in LEGACY_KIT_KEYS only so its
 * seal stamp keeps being hidden.
 */
const RETIRED = new Set(["khmer-gold", "kbach-lotus"]);
export const DESIGN_KITS: Record<string, DesignKit> = Object.fromEntries(
  Object.entries({ ...LEGACY, ...GENERATED }).filter(([k]) => !RETIRED.has(k)),
) as Record<string, DesignKit>;
/** The two original kits, which have their own seal stamp and flap medallion. */
export const LEGACY_KIT_KEYS = Object.keys(LEGACY);

export type DesignKitKey = string;
export const DESIGN_KIT_KEYS = Object.keys(DESIGN_KITS) as [DesignKitKey, ...DesignKitKey[]];

export function designKitOf(key: string | null | undefined): DesignKit {
  return DESIGN_KITS[key ?? ""] ?? DESIGN_KITS["vintage-flourish"];
}

/**
 * The kit as CSS: a file and a proportion per role, and the rule that hides
 * every element belonging to another kit.
 */
export function designKitCss(key: string | null | undefined): string {
  const kit = designKitOf(key);
  const vars = ORNAMENT_ROLES.map((role) => {
    const art = kit.ornaments[role];
    return `--orn-${role}:url(${art.src});--orn-${role}-ar:${art.w} / ${art.h};--orn-${role}-scale:${art.scale ?? 1};`;
  }).join("");
  const others = LEGACY_KIT_KEYS.filter((k) => k !== kit.key)
    .map((k) => `.kit-only-${k}`)
    .join(",");
  // the generated kits print their own mark on the seal and the flap
  const generic = LEGACY_KIT_KEYS.includes(kit.key) ? ".kit-generated{display:none!important}" : "";
  /*
   * The stationery papers carry their own crest and dividers, drawn from the
   * vintage pack, and they apply over the default (vintage) kit. A kit the
   * couple chose themselves wins over the paper's — hence the stronger
   * selector for every other kit.
   */
  const root = kit.key === "vintage-flourish" ? ":root" : "html:root:root";
  return `${root}{${vars}}${others ? `${others}{display:none!important}` : ""}${generic}`;
}

import type { DressColor, DressGroup } from "./db/schema";

/** Enough for two groups of a few colours each. */
export const MAX_DRESS_COLORS = 12;
export const MAX_DRESS_GROUPS = 4;

/** The fabric photos shipped with the app (public/dress). */
export const BUILTIN_DRESS_IMAGE = /^\/dress\/[a-z0-9-]+\.webp$/;

/** The colours to show: valid hex only, in the couple's order. */
export function dressPalette(list: unknown): DressColor[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((c): c is DressColor => !!c && typeof c === "object" && /^#[0-9a-f]{6}$/i.test((c as DressColor).hex))
    .slice(0, MAX_DRESS_COLORS)
    .map((c) => {
      const out: DressColor = { hex: c.hex.toLowerCase(), name: typeof c.name === "string" ? c.name : "" };
      if (Number.isInteger(c.group) && (c.group as number) >= 0) out.group = c.group;
      if (typeof c.mediaId === "string" && c.mediaId) out.mediaId = c.mediaId;
      if (typeof c.image === "string" && BUILTIN_DRESS_IMAGE.test(c.image)) out.image = c.image;
      return out;
    });
}

export function dressGroupList(list: unknown): DressGroup[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((g): g is DressGroup => !!g && typeof g === "object")
    .slice(0, MAX_DRESS_GROUPS)
    .map((g) => ({ title: typeof g.title === "string" ? g.title : "", note: typeof g.note === "string" ? g.note : "" }));
}

/** The fabric photo, if the colour has one. */
export function dressImageSrc(c: DressColor): string {
  if (c.mediaId) return `/api/media/${c.mediaId}`;
  return c.image ?? "";
}

/**
 * The colours as they are laid out: one section per group (or a single one
 * when there are no groups), and inside it runs of neighbouring colours that
 * share a name, so three golds are labelled "Gold" once, under all three.
 */
export type DressRun = { name: string; colors: DressColor[] };
export type DressSection = { group: DressGroup | null; runs: DressRun[] };

export function dressLayout(colors: DressColor[], groups: DressGroup[]): DressSection[] {
  const toRuns = (list: DressColor[]) =>
    list.reduce<DressRun[]>((runs, c) => {
      const last = runs[runs.length - 1];
      const name = c.name.trim();
      if (last && name && last.name === name) last.colors.push(c);
      else runs.push({ name, colors: [c] });
      return runs;
    }, []);
  if (groups.length === 0) return colors.length ? [{ group: null, runs: toRuns(colors) }] : [];
  const sections: DressSection[] = groups.map((g, i) => ({
    group: g,
    runs: toRuns(colors.filter((c) => (c.group ?? 0) === i)),
  }));
  // a colour pointing past the last group goes with the last one
  const stray = colors.filter((c) => (c.group ?? 0) >= groups.length);
  if (stray.length) sections[sections.length - 1].runs.push(...toRuns(stray));
  return sections.filter((s) => s.runs.length > 0);
}

/** Relative luminance (WCAG), 0 = black, 1 = white. */
export function luminance(hex: string) {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = ch.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

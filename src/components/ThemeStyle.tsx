import type { Wedding } from "@/lib/db/schema";

/**
 * Injects the admin-configured palette and fonts as CSS custom properties.
 *
 * The single gold the admin picks is expanded here into a four-stop metallic
 * ramp (deep → light) used by the foil text, dividers and buttons. Deriving it
 * rather than hard-coding keeps the theme editor meaningful while guaranteeing
 * the dark end of the ramp stays dark enough to read on an ivory page.
 */
export function ThemeStyle({ wedding }: { wedding: Wedding }) {
  const gold = sanitize(wedding.colorSecondary, "#C29A5B");
  const primary = sanitize(wedding.colorPrimary, "#4A3527");
  const accent = sanitize(wedding.colorAccent, "#E3D3B8");
  const background = sanitize(wedding.colorBackground, "#F6F3EE");
  /* The ramp needs the paper: its catchlight is capped against it. */
  const ramp = goldRamp(gold, background);
  const text = sanitize(wedding.colorText, "#4A3A2C");
  // The surface the card sits on: the paper stock, a shade deeper.
  const stage = shade(background, -0.1);
  // The side zones sit deeper again, so the three regions separate cleanly.
  const zone = shade(background, -0.17);

  /*
   * The cinematic set: the velvet the curtains are cut from, and the room the
   * envelope opens in.
   *
   * Both are *derived from the theme's own primary colour* rather than picked.
   * The brief offers champagne, ivory, blush or burgundy velvet, and the right
   * answer is whichever one the couple already chose for their invitation — a
   * burgundy theme wants burgundy velvet and the blush theme wants blush, and
   * nobody should have to set that twice or be able to set it wrong. One
   * control, always coherent.
   *
   * A fold is a cylinder of cloth, so it needs three tones and not two: the
   * valley it turns into, the body of the cloth, and the crest the light
   * actually lands on. `glint` is the fourth, for velvet's one signature —
   * the pile goes bright at a grazing angle, which is why velvet reads as
   * velvet and satin as satin.
   */
  const velvet = {
    /*
     * Built from the *accent* and dragged towards the primary for its shadows.
     *
     * Ramping the primary up and down was the first attempt, and on a dark
     * primary the whole ramp came out between near-black and mud — two panels
     * of it read as slabs rather than as cloth. The accent is the theme's own
     * blush, and the shadows are *mixed* toward the primary rather than toward
     * black because velvet keeps its hue in shadow. That is most of what
     * separates velvet from felt.
     */
    /*
     * Five tones, and the spread between them matters more than any one of
     * them. An earlier ramp ran from a mid mauve to near-white with most of its
     * range in the top half, and two panels of it read as *satin* — pale,
     * smooth, and evenly lit. Velvet is the opposite: a deep body with a narrow
     * crest, because the pile absorbs light everywhere except where it is
     * caught end-on. So the shadows go much further toward the primary, the
     * crest stays where it was, and the distance between them is what does the
     * work.
     */
    /*
     * And the dark end goes *past* the primary, not up to it.
     *
     * Mixing at 0.92 lands on the primary itself, which on a blush theme is a
     * dusty rose — so the whole ramp ran between a mid rose and a pale one, a
     * span of about a third of the luminance scale. Shading a fold inside that
     * span cannot produce depth however the stops are arranged: the valleys
     * come out only slightly darker than the crests, and two panels of it read
     * as a flat pink wall with stripes on it rather than as hanging cloth.
     * Darkening the full mix by 0.44 roughly doubles the range while keeping
     * the hue, which is what actually makes the folds turn.
     */
    dark: shade(mix(accent, primary, 1), -0.44),
    deep: shade(mix(accent, primary, 0.86), -0.18),
    mid: mix(accent, primary, 0.42),
    lit: mix(accent, primary, 0.05),
    glint: shade(accent, 0.55),
  };
  /*
   * The same five tones resampled into a continuous scale.
   *
   * The curtain shades each fold from a *function* — a broad body with a soft
   * crest riding on it — rather than from five hand-placed stops, and a
   * function needs to be able to ask for the colour at 0.63 of the way up the
   * ramp. `color-mix()` would do it in CSS, but every stop of every fold would
   * then be one more thing that has to work on the phone, and the five-stop
   * version already fails there in ways that took a week to find. Resolving
   * the scale here, once, to plain hex leaves the SVG referencing nothing but
   * `var()`.
   *
   * Thirty-three steps: fine enough that no two adjacent gradient stops land
   * on the same tone and flatten a section of the curve.
   */
  const tones = velvetScale(velvet, 33);
  /*
   * The room the envelope opens in, and the set behind the curtains.
   *
   * Light, not dark. A near-black theatre is the obvious way to make a lit
   * object look cinematic and it is the wrong one here: this is a blush and
   * ivory wedding invitation, and dropping it into a black box makes the two
   * halves of the experience look like they came from different projects. A
   * soft blush that deepens to dusty rose at the edges does the same work —
   * it still puts a pool of light in the middle and still falls away — while
   * staying inside the same palette as everything it introduces.
   */
  const room = {
    near: shade(accent, 0.62),
    far: mix(accent, primary, 0.36),
  };

  // Tailwind's sizes are in rem, so scaling the root size scales the whole
  // invitation — type and the spacing around it together, in proportion.
  const fontScale = Math.min(140, Math.max(70, wedding.fontScale)) / 100;

  const css = `:root{
    font-size:${(16 * fontScale).toFixed(2)}px;
    --c-primary:${primary};
    --c-secondary:${gold};
    --c-accent:${accent};
    --c-bg:${background};
    --c-text:${text};
    --c-stage:${stage};
    --c-zone:${zone};
    --gold-frame:${gold};
    --gold-deep:${ramp.deep};
    --gold-1:${ramp.dark};
    --gold-2:${ramp.mid};
    --gold-3:${ramp.light};
    --gold-lite:${ramp.lite};
    --c-primary-rgb:${channels(primary)};
    --c-secondary-rgb:${channels(gold)};
    --c-accent-rgb:${channels(accent)};
    --c-bg-rgb:${channels(background)};
    --c-text-rgb:${channels(text)};
    --c-stage-rgb:${channels(stage)};
    --c-zone-rgb:${channels(zone)};
    --gold-frame-rgb:${channels(gold)};
    --gold-deep-rgb:${channels(ramp.deep)};
    --gold-1-rgb:${channels(ramp.dark)};
    --gold-3-rgb:${channels(ramp.light)};
    --gold-lite-rgb:${channels(ramp.lite)};
    --vel-dark:${velvet.dark};
    --vel-deep:${velvet.deep};
    --vel-mid:${velvet.mid};
    --vel-lit:${velvet.lit};
    --vel-glint:${velvet.glint};
    ${tones.map((t, i) => `--vel-t${i}:${t};`).join("")}
    --vel-dark-rgb:${channels(velvet.dark)};
    --vel-deep-rgb:${channels(velvet.deep)};
    --vel-lit-rgb:${channels(velvet.lit)};
    --vel-glint-rgb:${channels(velvet.glint)};
    --room-far:${room.far};
    --room-near:${room.near};
    --room-far-rgb:${channels(room.far)};
    --f-heading:${sanitizeFont(wedding.fontHeading, "'Khmer OS Muol Light'")};
    --f-body:${sanitizeFont(wedding.fontBody, "'Noto Sans Khmer'")};
  }`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/** Builds the metallic ramp around the chosen gold. */
function goldRamp(hex: string, background: string) {
  return {
    deep: shade(hex, -0.5),  // ~7:1 on ivory — safe for small text
    dark: shade(hex, -0.32), // ~4.5:1 — the body of the foil gradient
    mid: shade(hex, -0.14),  // ~3:1  — passes AA for large display text
    light: shade(hex, 0.06), // highlight glint only, kept to a narrow band
    /*
     * The catchlight, and it is deliberately *not* on the line above.
     *
     * `deep`…`light` is an ink ramp: four tones of the theme's gold, all of
     * them darker than the paper, chosen so foil text stays legible. A metal
     * gradient needs one thing that ramp cannot give it — a tone brighter than
     * its ground, the flash a polished die throws back where the light hits it
     * square. Built by mixing toward a warm ivory rather than white so it stays
     * champagne rather than going chalky.
     *
     * **And it is now capped against the paper, which is the whole story of a
     * monogram reported "cut" for eight rounds.** That flash sits at the middle
     * of the foil gradient, so on a pale theme it landed within a few points of
     * the background — and the middle of the mark simply disappeared. What is
     * left reads as two disconnected pieces of letter, which is exactly what
     * "render incomplete" looks like and is nothing whatever to do with
     * clipping. It is bright enough to be a flash *against the gold around it*;
     * it must never be bright enough to be paper.
     *
     * A metal highlight brighter than the ground is right for a large surface
     * and wrong for hairline script on ivory — the catchlight is a third of the
     * mark's width, and a third of a letter is not a highlight, it is a hole.
     */
    lite: capToward(mix(hex, "#fff6df", 0.6), background, 16),
  };
}

/**
 * Keep `colour` at least `gap` points of luminance away from `ground`.
 *
 * Only ever darkens, and only when it has to: a tone already clear of the
 * background is returned untouched, so a deep theme keeps its full catchlight
 * and only a pale one is reined in.
 */
function capToward(colour: string, ground: string, gap: number): string {
  const lum = (hex: string) => {
    const v = hex.replace("#", "");
    const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v.slice(0, 6).padEnd(6, "0");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ceiling = lum(ground) - gap;
  let out = colour;
  /* Step it down rather than solving for it: the mix is not linear in
     luminance, and eight small steps land closer than one clever one. */
  for (let i = 0; i < 8 && lum(out) > ceiling; i++) {
    out = mix(out, "#000000", 0.06);
  }
  return out;
}

/** "#7B1F2F" → "123 31 47", the form Tailwind's opacity modifier needs. */
function channels(hex: string): string {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value.split("").map((c) => c + c).join("")
      : value.slice(0, 6).padEnd(6, "0");
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(" ");
}

/** Blends `t` of `b` into `a`. */
/**
 * Resamples the five velvet tones into an evenly spaced scale of `steps`.
 *
 * Piecewise-linear through the anchors rather than a single interpolation
 * between the ends, because the anchors are not evenly spaced in luminance —
 * the gap from `dark` to `deep` is much larger than the one from `lit` to
 * `glint`, and that uneven spacing *is* the velvet. Straightening it out would
 * give the ramp of a smooth weave.
 */
function velvetScale(
  velvet: { dark: string; deep: string; mid: string; lit: string; glint: string },
  steps: number,
): string[] {
  const anchors = [velvet.dark, velvet.deep, velvet.mid, velvet.lit, velvet.glint];
  const last = anchors.length - 1;
  return Array.from({ length: steps }, (_, i) => {
    const at = (i / (steps - 1)) * last;
    const lower = Math.min(last - 1, Math.floor(at));
    return mix(anchors[lower], anchors[lower + 1], at - lower);
  });
}

function mix(a: string, b: string, t: number): string {
  const read = (hex: string) => {
    const value = hex.replace("#", "");
    const full =
      value.length === 3
        ? value.split("").map((c) => c + c).join("")
        : value.slice(0, 6).padEnd(6, "0");
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  };
  const [x, y] = [read(a), read(b)];
  const out = x.map((c, i) => Math.round(c + (y[i] - c) * t));
  return `#${out.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")}`;
}

/** Lightens (amount > 0) or darkens (amount < 0) a hex colour. */
function shade(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value.split("").map((c) => c + c).join("")
      : value.slice(0, 6).padEnd(6, "0");

  const channels = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16);
    const target = amount < 0 ? 0 : 255;
    return Math.round(channel + (target - channel) * Math.abs(amount));
  });

  return `#${channels.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")}`;
}

function sanitize(value: string, fallback: string) {
  const clean = value.trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(clean) ? clean : fallback;
}

function sanitizeFont(value: string, fallback: string) {
  const clean = value.trim();
  return /^[\w\s'",-]+$/.test(clean) && clean.length < 80 ? clean : fallback;
}

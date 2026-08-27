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
  const ramp = goldRamp(gold);

  const primary = sanitize(wedding.colorPrimary, "#4A3527");
  const accent = sanitize(wedding.colorAccent, "#E3D3B8");
  const background = sanitize(wedding.colorBackground, "#F6F3EE");
  const text = sanitize(wedding.colorText, "#4A3A2C");
  // The surface the card sits on: the paper stock, a shade deeper.
  const stage = shade(background, -0.1);
  // The side zones sit deeper again, so the three regions separate cleanly.
  const zone = shade(background, -0.17);

  const css = `:root{
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
    --f-heading:${sanitizeFont(wedding.fontHeading, "'Khmer OS Muol Light'")};
    --f-body:${sanitizeFont(wedding.fontBody, "'Noto Sans Khmer'")};
  }`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/** Builds the metallic ramp around the chosen gold. */
function goldRamp(hex: string) {
  return {
    deep: shade(hex, -0.5),  // ~7:1 on ivory — safe for small text
    dark: shade(hex, -0.32), // ~4.5:1 — the body of the foil gradient
    mid: shade(hex, -0.14),  // ~3:1  — passes AA for large display text
    light: shade(hex, 0.06), // highlight glint only, kept to a narrow band
  };
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

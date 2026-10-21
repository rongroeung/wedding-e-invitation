/**
 * Khmer-inspired decorative primitives.
 * All hand-drawn inline SVG — no image requests, crisp on every screen, and
 * they inherit the theme colour so the admin palette applies everywhere.
 */
import type { CSSProperties } from "react";
import { DESIGN_KITS, type OrnamentRole } from "@/lib/designKit";

type Props = { className?: string; style?: CSSProperties };

/**
 * One ornament of the active design kit, by the job it does on the card.
 *
 * The component never knows which kit is in use: `ThemeStyle` publishes the
 * file and proportions for every role (`--orn-<role>`, see `lib/designKit`),
 * and this draws whatever is there. The fallbacks are the default kit, so a
 * page without the theme (the 404) still has its ornaments.
 *
 * Drawn through a CSS mask: the file supplies the shape and the theme's gold
 * ramp is the metal, so a change of theme recolours every ornament together,
 * and the box is transparent wherever the ornament is not. `draw` makes it
 * open outward from its centre when its section is revealed.
 */
export function Flourish({
  role,
  className = "",
  style,
  draw = false,
}: {
  role: OrnamentRole;
  className?: string;
  style?: CSSProperties;
  draw?: boolean;
}) {
  const art = DESIGN_KITS["vintage-flourish"].ornaments[role];
  return (
    <span
      className={`flourish ${draw ? "flourish-draw" : ""} ${className}`}
      style={
        {
          aspectRatio: `var(--orn-${role}-ar, ${art.w} / ${art.h})`,
          "--fl": `var(--orn-${role}, url(${art.src}))`,
          ...style,
        } as CSSProperties
      }
      aria-hidden="true"
    />
  );
}

/** A section divider: one ornament of the kit, centred, at a width that suits its job. */
export function FlourishDivider({
  role = "title",
  width = 150,
  className = "",
}: {
  role?: OrnamentRole;
  /** Width in px at full size; it never exceeds the column. */
  width?: number;
  className?: string;
}) {
  return (
    <Flourish
      role={role}
      draw
      className={`mx-auto ${className}`}
      style={{ width: `min(calc(${width}px * var(--orn-${role}-scale, 1)), 86%)` }}
    />
  );
}

/**
 * Stylised lotus bud. Kept only so older imports compile; nothing on the
 * invitation draws it any more (the couple asked for no lotus anywhere).
 */
export function Lotus({ className = "h-6 w-6", style }: Props) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" fill="currentColor">
      <path d="M50 8c11 20 18 34 18 48a18 18 0 0 1-36 0c0-14 7-28 18-48Z" opacity=".95" />
      <path d="M28 30C13 44 5 58 6 71c1 12 11 20 22 19 6-1 11-4 15-9-9-13-14-29-15-51Z" opacity=".7" />
      <path d="M72 30c15 14 23 28 22 41-1 12-11 20-22 19-6-1-11-4-15-9 9-13 14-29 15-51Z" opacity=".7" />
      <path d="M6 60c-4 16 4 30 18 36 12 5 25 2 33-7-18-4-35-14-51-29Z" opacity=".45" />
      <path d="M94 60c4 16-4 30-18 36-12 5-25 2-33-7 18-4 35-14 51-29Z" opacity=".45" />
    </svg>
  );
}

/** Angkor-inspired scrolling kbach motif used inside dividers. */
export function KbachScroll({ className = "h-8 w-24", style }: Props) {
  return (
    <svg viewBox="0 0 240 60" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor">
      <path d="M8 30c22 0 26-18 42-18s18 22 34 22 20-24 36-24 20 20 36 20 22-14 36-14" strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
      <path d="M8 38c18 4 30-6 44-6s16 12 30 12 20-12 32-12 18 10 32 10 20-8 34-8" strokeWidth="1.1" strokeLinecap="round" opacity=".55" />
      <circle cx="120" cy="30" r="3.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Ornamental corner (គំនូរជ្រុង) — rotate with the `rotate` prop. */
export function CornerOrnament({
  className = "h-24 w-24",
  rotate = 0,
  style,
}: Props & { rotate?: number }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <path d="M12 148V44c0-18 14-32 32-32h104" strokeWidth="1.4" opacity=".9" />
      <path d="M24 148V50c0-14 11-26 26-26h98" strokeWidth="0.9" opacity=".5" />
      <path d="M36 96c0-26 18-46 44-48 14-1 24 6 26 17 2 12-7 21-18 21-9 0-16-6-16-14 0-7 5-12 11-12" strokeWidth="1.3" opacity=".85" />
      <path d="M36 118c14 2 28-4 38-16" strokeWidth="1" opacity=".6" />
      <circle cx="83" cy="86" r="3" fill="currentColor" stroke="none" />
      <path d="M12 12c10 0 18 8 18 18" strokeWidth="1.2" opacity=".7" />
    </svg>
  );
}

/** Horizontal gold divider with a small diamond at its centre. */
export function GoldDivider({
  className = "",
  width = "max-w-xs",
  icon = "diamond",
}: {
  className?: string;
  width?: string;
  icon?: "diamond" | "none";
}) {
  return (
    <div className={`mx-auto flex w-full items-center justify-center gap-3 ${width} ${className}`}>
      <span className="gold-line h-px flex-1" />
      {icon === "diamond" && (
        <span className="h-2 w-2 rotate-45 bg-gold-dark" aria-hidden="true" />
      )}
      <span className="gold-line h-px flex-1" />
    </div>
  );
}

/**
 * A heart in the card's gold: the shape of the heart in the couple's name
 * mark, struck in the same foil as every other ornament on the page — the
 * theme's gold ramp (`--gold-1` … `--gold-3`), on the same diagonal as the
 * `Flourish` ornaments — so it follows the theme like they do.
 */
export function Heart({ className = "h-8 w-8" }: Props) {
  return (
    <svg viewBox="0 0 24 22" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="heart-foil" x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" style={{ stopColor: "var(--gold-1)" }} />
          <stop offset="0.24" style={{ stopColor: "var(--gold-2)" }} />
          <stop offset="0.44" style={{ stopColor: "var(--gold-3)" }} />
          <stop offset="0.62" style={{ stopColor: "var(--gold-2)" }} />
          <stop offset="0.84" style={{ stopColor: "var(--gold-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--gold-2)" }} />
        </linearGradient>
      </defs>
      <path
        d="M12 20.6C6.2 16.2 2 12.6 2 8.1 2 5 4.4 2.6 7.3 2.6c1.9 0 3.6 1 4.7 2.6 1.1-1.6 2.8-2.6 4.7-2.6C19.6 2.6 22 5 22 8.1c0 4.5-4.2 8.1-10 12.5z"
        fill="url(#heart-foil)"
      />
    </svg>
  );
}

/** Subtle full-bleed background pattern. */
export function PatternBackground({ pattern = "none" }: { pattern?: string }) {
  // "lotus" is no longer drawn (no lotus anywhere); a wedding still set to it shows none
  if (pattern === "none" || pattern === "lotus") return null;
  const id = `pat-${pattern}`;
  return (
    <svg
      className="section-pattern pointer-events-none absolute inset-0 h-full w-full text-gold"
      aria-hidden="true"
      style={{ opacity: 0.09 }}
    >
      <defs>
        {pattern === "angkor" && (
          <pattern id={id} width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M36 6l12 12-12 12-12-12 12-12Zm0 36l12 12-12 12-12-12 12-12Z" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="36" cy="36" r="2" fill="currentColor" />
          </pattern>
        )}
        {pattern === "floral" && (
          <pattern id={id} width="90" height="90" patternUnits="userSpaceOnUse">
            {/* a small five-petalled blossom and a pair of leaves */}
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="45" cy="38" rx="4.2" ry="6.4" transform={`rotate(${a} 45 45)`} fill="none" stroke="currentColor" strokeWidth=".8" />
            ))}
            <circle cx="45" cy="45" r="1.6" fill="currentColor" />
            <path d="M20 72c8-6 15-6 22-2M70 72c-8-6-15-6-22-2" fill="none" stroke="currentColor" strokeWidth=".8" />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Envelope / letter glyph for the cover button. */
export function EnvelopeIcon({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

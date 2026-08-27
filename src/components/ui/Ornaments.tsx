/**
 * Khmer-inspired decorative primitives.
 * All hand-drawn inline SVG — no image requests, crisp on every screen, and
 * they inherit the theme colour so the admin palette applies everywhere.
 */
import type { CSSProperties } from "react";

type Props = { className?: string; style?: CSSProperties };

/** Stylised lotus bud (ផ្កាឈូក) used as a repeating accent. */
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

/** Horizontal gold divider with a lotus at its centre. */
export function GoldDivider({
  className = "",
  width = "max-w-xs",
  icon = "lotus",
}: {
  className?: string;
  width?: string;
  icon?: "lotus" | "diamond" | "none";
}) {
  return (
    <div className={`mx-auto flex w-full items-center justify-center gap-3 ${width} ${className}`}>
      <span className="gold-line h-px flex-1" />
      {icon === "lotus" && <Lotus className="h-5 w-5 shrink-0 text-gold" />}
      {icon === "diamond" && (
        <span className="h-2 w-2 rotate-45 bg-gold" aria-hidden="true" />
      )}
      <span className="gold-line h-px flex-1" />
    </div>
  );
}

/** Two interlocking rings — used above the couple’s names. */
export function WeddingRings({ className = "h-10 w-16" }: Props) {
  return (
    <svg viewBox="0 0 120 70" className={className} aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="46" cy="40" r="22" strokeWidth="2.2" />
      <circle cx="74" cy="40" r="22" strokeWidth="2.2" opacity=".85" />
      <path d="M60 12l4 7h-8l4-7Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Subtle full-bleed background pattern. */
export function PatternBackground({ pattern = "lotus" }: { pattern?: string }) {
  if (pattern === "none") return null;
  const id = `pat-${pattern}`;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-gold"
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
            <path d="M45 22c6 10 10 16 10 23a10 10 0 1 1-20 0c0-7 4-13 10-23Z" fill="none" stroke="currentColor" strokeWidth=".9" />
            <path d="M20 68c10-6 18-6 25-2M70 68c-10-6-18-6-25-2" fill="none" stroke="currentColor" strokeWidth=".8" />
          </pattern>
        )}
        {pattern === "lotus" && (
          <pattern id={id} width="110" height="110" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
            <path d="M55 30c7 12 11 20 11 28a11 11 0 0 1-22 0c0-8 4-16 11-28Z" fill="none" stroke="currentColor" strokeWidth=".9" />
            <path d="M33 44c-8 8-12 16-11 23 1 6 6 10 11 10 3 0 6-2 8-5-4-7-7-16-8-28Z" fill="none" stroke="currentColor" strokeWidth=".7" />
            <path d="M77 44c8 8 12 16 11 23-1 6-6 10-11 10-3 0-6-2-8-5 4-7 7-16 8-28Z" fill="none" stroke="currentColor" strokeWidth=".7" />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Decorative frame drawn around a panel. */
export function OrnateFrame({ className = "" }: Props) {
  return (
    <div className={`pointer-events-none absolute inset-0 text-gold ${className}`} aria-hidden="true">
      <CornerOrnament className="absolute left-0 top-0 h-16 w-16 sm:h-20 sm:w-20" />
      <CornerOrnament className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20" rotate={90} />
      <CornerOrnament className="absolute bottom-0 right-0 h-16 w-16 sm:h-20 sm:w-20" rotate={180} />
      <CornerOrnament className="absolute bottom-0 left-0 h-16 w-16 sm:h-20 sm:w-20" rotate={270} />
    </div>
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

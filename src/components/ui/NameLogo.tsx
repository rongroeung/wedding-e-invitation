import { Butterfly } from "./Butterfly";
import { monogramFont, monogramStack } from "@/lib/monogram-fonts";

/**
 * The couple's names as one mark: the groom's short name high on the left, the
 * bride's low on the right, a fine gold flourish running between them, a small
 * heart where it crosses the middle, and a butterfly settled at the top.
 *
 * It is the invitation's identity and it is drawn the same way everywhere it
 * appears — on the envelope's flap, on the card inside, and on the cover — so a
 * guest sees one mark travel through the whole opening rather than three
 * related ones.
 *
 * **The names are HTML, never SVG `<text>`.** Khmer is shaped by the browser's
 * text engine: subscript consonants (coeng), vowels above and below the base,
 * and the way they stack. SVG text goes through a different path in WebKit and
 * is where that shaping is least dependable — and it gives a script mark no
 * room above and below for those marks. The ornament is SVG because it is a
 * drawing; the names are type because they are type.
 *
 * Nothing here sets `letter-spacing`, and the reveal masks are bled well past
 * the line box at top and bottom, so no vowel sign or subscript is ever cut —
 * and the mask is removed outright once the reveal is over.
 *
 * The face is the couple's monogram face when that face is Khmer (the dashboard
 * picker already governs it), and Moulpali otherwise: a Latin script face has
 * no Khmer glyphs and would fall back to whatever the phone has.
 */

/** "សុខ វិសាល" → "វិសាល". Khmer names are written family name first, so the
 *  given name — the one a guest calls them by — is the last word. */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export type NameLogoState = "still" | "wait" | "play";

export function NameLogo({
  groom,
  bride,
  font,
  state = "still",
  className = "",
}: {
  groom: string;
  bride: string;
  /** The couple's monogram font id; used when it is a Khmer face. */
  font?: string | null;
  /**
   * `still` — drawn, no animation (the envelope, previews, reduced motion).
   * `wait`  — hidden, about to play (the cover behind closed curtains).
   * `play`  — the reveal: names left to right, the flourish draws, the heart,
   *           then the butterfly settles.
   */
  state?: NameLogoState;
  className?: string;
}) {
  const face = monogramFont(font);
  const family = face.script === "khmer" ? monogramStack(face) : "'Moulpali', 'Moul', serif";
  const a = shortName(groom);
  const b = shortName(bride);

  return (
    <div
      className={`namelogo namelogo-${state} ${className}`}
      role="img"
      aria-label={`${a} និង ${b}`}
      style={{ ["--nl-face" as string]: family }}
    >
      <svg className="namelogo-flourish" viewBox="0 0 300 150" aria-hidden="true" preserveAspectRatio="none">
        {/* One continuous line: out from under the groom's name, a loop
            through the middle where the heart sits, and into the bride's. */}
        <path
          className="namelogo-line"
          pathLength={1}
          d="M34 72 C 70 70, 104 62, 128 72 C 146 80, 150 98, 138 104 C 126 110, 116 96, 128 86 C 146 70, 176 80, 196 84 C 220 89, 246 92, 268 90"
        />
        <path
          className="namelogo-line namelogo-line-fine"
          pathLength={1}
          d="M52 80 C 82 80, 102 74, 120 78"
        />
        <path
          className="namelogo-line namelogo-line-fine"
          pathLength={1}
          d="M184 92 C 206 96, 228 98, 252 96"
        />
      </svg>

      {/* the scrolled end of the pack's long rule, where the line begins */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="namelogo-tip namelogo-tip-a kit-only-vintage-flourish" src="/kit/flourish/rule-end.svg" alt="" aria-hidden="true" draggable={false} />

      <span className="namelogo-name namelogo-a khmer-wrap">{a}</span>
      <span className="namelogo-name namelogo-b khmer-wrap">{b}</span>

      <svg className="namelogo-heart" viewBox="0 0 24 22" aria-hidden="true">
        <path d="M12 20.6C6.2 16.2 2 12.6 2 8.1 2 5 4.4 2.6 7.3 2.6c1.9 0 3.6 1 4.7 2.6 1.1-1.6 2.8-2.6 4.7-2.6C19.6 2.6 22 5 22 8.1c0 4.5-4.2 8.1-10 12.5z" />
      </svg>

      <Butterfly className="namelogo-fly" />
    </div>
  );
}

/**
 * Decorative monogram for the cover. Uses the admin-supplied text when set,
 * otherwise falls back to the couple's initials, and finally to an entwined
 * pair of rings so the cover is never empty.
 */
export function Monogram({
  text,
  groom,
  bride,
  className = "h-40 w-40",
}: {
  text?: string;
  groom?: string;
  bride?: string;
  className?: string;
}) {
  const letters = (text?.trim() || initials(groom, bride)).slice(0, 5);

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {/* a slowly turning ring of light behind the letters */}
      <g className="halo-spin" opacity="0.5">
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeDasharray="2 10"
        />
      </g>

      {/* flourishes cradling the letters */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" opacity="0.75">
        <path d="M42 62c-14 10-20 24-16 36 3 10 13 15 21 11 7-3 9-12 4-18-4-5-11-5-15 0" strokeWidth="1.4" />
        <path d="M158 62c14 10 20 24 16 36-3 10-13 15-21 11-7-3-9-12-4-18 4-5 11-5 15 0" strokeWidth="1.4" />
        <path d="M62 42c12-9 26-12 38-8" strokeWidth="1.2" opacity=".8" />
        <path d="M138 42c-12-9-26-12-38-8" strokeWidth="1.2" opacity=".8" />
        <path d="M56 150c14 10 30 14 44 12 14 2 30-2 44-12" strokeWidth="1.4" />
        <path d="M74 162c9 5 18 7 26 7s17-2 26-7" strokeWidth="1" opacity=".65" />
      </g>

      <circle cx="100" cy="24" r="2.6" fill="currentColor" opacity="0.8" />
      <circle cx="100" cy="178" r="2.2" fill="currentColor" opacity="0.7" />

      <text
        x="100"
        y="118"
        textAnchor="middle"
        fill="currentColor"
        style={{
          fontFamily: "'Cormorant Garamond', 'Noto Serif Khmer', serif",
          fontSize: letters.length > 2 ? "58px" : "76px",
          fontStyle: "italic",
          letterSpacing: "0.02em",
        }}
      >
        {letters}
      </text>
    </svg>
  );
}

function initials(groom?: string, bride?: string) {
  const first = (value?: string) => (value?.trim()?.split(/\s+/).pop() ?? "").charAt(0);
  const pair = `${first(groom)}${first(bride)}`;
  return pair.trim() ? pair : "♥";
}

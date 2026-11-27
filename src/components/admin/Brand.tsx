/**
 * The system's name, នាំសារ, with its mark: a sealed envelope in gold
 * on deep wine — an original drawing (no flowers). The name is HTML text in
 * Moul, so the Khmer shapes correctly.
 */
export const BRAND_NAME = "នាំសារ";

export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#5e1427" />
      <rect x="1" y="1" width="46" height="46" rx="11" fill="none" stroke="#7d2238" strokeWidth="2" />
      {/* the envelope */}
      <rect x="9" y="15" width="30" height="20" rx="2.2" fill="none" stroke="#d9b066" strokeWidth="2" />
      <path d="M10 16.5 L24 27 L38 16.5" fill="none" stroke="#d9b066" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 34 L20.5 25 M38 34 L27.5 25" fill="none" stroke="#d9b066" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      {/* the seal: a wax disc with a small diamond */}
      <circle cx="24" cy="27" r="5" fill="#d9b066" />
      <circle cx="22.6" cy="25.6" r="1.6" fill="#f6e3b0" opacity="0.7" />
      <circle cx="24" cy="27" r="3.6" fill="none" stroke="#7a2034" strokeWidth="0.8" opacity="0.6" />
      <path d="M24 24.6 L26.4 27 L24 29.4 L21.6 27 Z" fill="#7a2034" opacity="0.85" />
    </svg>
  );
}

export function Brand({ size = "sm", tagline }: { size?: "sm" | "lg"; tagline?: string }) {
  const lg = size === "lg";
  return (
    <div className={`flex items-center ${lg ? "gap-3.5" : "gap-2.5"}`}>
      <BrandMark className={lg ? "h-14 w-14 shrink-0 drop-shadow-sm" : "h-9 w-9 shrink-0"} />
      <div className="min-w-0">
        <p
          /* no truncate here: its overflow:hidden cut off Moul's tall vowels
             (ុ ឿ ំ); the line box is tall enough to hold them */
          className={`brand-name whitespace-nowrap pt-[0.12em] leading-[1.9] text-[#6b1a2c] ${lg ? "text-2xl" : "text-[0.95rem]"}`}
          style={{ fontFamily: "Moul, 'Noto Serif Khmer', serif" }}
        >
          {BRAND_NAME}
        </p>
        {tagline && <p className={`truncate text-slate-500 ${lg ? "text-sm" : "text-xs"}`}>{tagline}</p>}
      </div>
    </div>
  );
}

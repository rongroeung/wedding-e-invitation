import type { Wedding } from "@/lib/db/schema";
import { dressPalette, luminance } from "@/lib/dressColors";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * ពណ៌សម្លៀកបំពាក់ — the colours guests are asked to wear.
 *
 * Each colour is a swatch of cloth rather than a flat dot: lit from the upper
 * left like everything else on the card, with a soft fold of shade and a fine
 * gold rim, so a guest can judge a real fabric against it. A pale colour
 * (white, ivory, champagne) gets a darker rim of its own, or it would vanish
 * into the paper. Hidden until the couple has added a colour.
 */
export function DressColors({ wedding }: { wedding: Wedding }) {
  const colors = dressPalette(wedding.dressColors);
  if (!wedding.dressCodeEnabled || colors.length === 0) return null;

  return (
    <section id="dress-colours" className="section-pad relative">
      <div className="mx-auto max-w-2xl">
        <SectionTitle
          title={wedding.dressCodeTitle || "ពណ៌សម្លៀកបំពាក់"}
          subtitle={wedding.dressCodeNote || undefined}
        />

        {/* balanced rows: up to five side by side, more split evenly (8 → 4 + 4) */}
        <ul
          className="reveal dress-palette"
          role="list"
          style={{ "--cols": colors.length <= 5 ? colors.length : Math.ceil(colors.length / 2) } as React.CSSProperties}
        >
          {colors.map((c, i) => (
            <li key={`${c.hex}-${i}`} className="dress-swatch">
              <span
                className="dress-chip"
                data-pale={luminance(c.hex) > 0.72 ? "" : undefined}
                style={{ "--chip": c.hex } as React.CSSProperties}
                role="img"
                aria-label={c.name || c.hex}
              />
              {c.name && <span className="dress-name text-ink/85 khmer-wrap">{c.name}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

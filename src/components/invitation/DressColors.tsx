import type { Wedding } from "@/lib/db/schema";
import { dressGroupList, dressImageSrc, dressLayout, dressPalette, luminance, type DressRun } from "@/lib/dressColors";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * ពណ៌សម្លៀកបំពាក់ — the colours guests are asked to wear.
 *
 * Each colour is a swatch of cloth rather than a flat dot. With a fabric
 * photo it shows the cloth itself; without one it is drawn, lit from the upper
 * left like everything else on the card, with a soft fold of shade. Either way
 * it has a fine gold rim, and a pale colour (white, ivory, champagne) gets a
 * darker rim of its own, or it would vanish into the paper.
 *
 * The colours may be split into groups, each with its own heading and line
 * (e.g. "Evening Attire" / "December-19, 2026"). Neighbouring colours with the
 * same name share one label under them all. Hidden until the couple has added
 * a colour.
 */
export function DressColors({ wedding }: { wedding: Wedding }) {
  const colors = dressPalette(wedding.dressColors);
  if (!wedding.dressCodeEnabled || colors.length === 0) return null;
  const sections = dressLayout(colors, dressGroupList(wedding.dressGroups));

  return (
    <section id="dress-colours" className="section-pad relative">
      <div className="mx-auto max-w-2xl">
        <SectionTitle
          title={wedding.dressCodeTitle || "ពណ៌សម្លៀកបំពាក់"}
          subtitle={wedding.dressCodeNote || undefined}
        />

        <div className="reveal dress-sections">
          {sections.map((s, i) => (
            <div key={i} className="dress-group">
              {s.group && (s.group.title || s.group.note) && (
                <header className="dress-group-head">
                  {s.group.title && <h3 className="dress-group-title khmer-wrap">{s.group.title}</h3>}
                  {s.group.note && <p className="dress-group-note khmer-wrap">{s.group.note}</p>}
                </header>
              )}
              <DressPalette runs={s.runs} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DressPalette({ runs, nameClass = "text-ink/85" }: { runs: DressRun[]; nameClass?: string }) {
  const count = runs.reduce((n, r) => n + r.colors.length, 0);
  return (
    <ul
      className="dress-palette"
      role="list"
      // balanced rows: up to five side by side, more split evenly (8 → 4 + 4)
      style={{ "--cols": count <= 5 ? count : Math.ceil(count / 2) } as React.CSSProperties}
    >
      {runs.map((run, i) => (
        <li key={i} className="dress-run" style={{ "--n": run.colors.length } as React.CSSProperties}>
          <span className="dress-run-chips">
            {run.colors.map((c, k) => {
              const src = dressImageSrc(c);
              return (
                <span
                  key={k}
                  className={`dress-chip ${src ? "dress-chip-photo" : ""}`}
                  data-pale={luminance(c.hex) > 0.72 ? "" : undefined}
                  style={
                    {
                      "--chip": c.hex,
                      ...(src ? { backgroundImage: `url("${src}")` } : {}),
                    } as React.CSSProperties
                  }
                  role="img"
                  aria-label={c.name || c.hex}
                />
              );
            })}
          </span>
          {run.name && <span className={`dress-name khmer-wrap ${nameClass}`}>{run.name}</span>}
        </li>
      ))}
    </ul>
  );
}

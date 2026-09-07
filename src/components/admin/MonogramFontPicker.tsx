"use client";

import { MONOGRAM_FONTS, monogramFont } from "@/lib/monogram-fonts";
import { Monogram } from "@/components/ui/Monogram";

/**
 * The face the monogram is set in, picked by looking at it.
 *
 * Every tile renders **the actual `Monogram` component** with the couple's own
 * initials, not a specimen line of the alphabet. That is the whole design of
 * this control: a face's name tells a couple nothing, a specimen tells them
 * what the font looks like, and only the mark itself tells them what *their
 * monogram* looks like — which is the only question being asked. It also means
 * the tile cannot drift from the card, because it is the same component solving
 * the same layout from the same metrics.
 *
 * Grouped by script, because the two groups are not alternatives to each other:
 * a couple with Latin initials is choosing among ten, not twenty, and the Khmer
 * ten would show them their initials in a face that was not drawn for them.
 */
export function MonogramFontPicker({
  value,
  monogram,
  groom,
  bride,
  onChange,
}: {
  value: string;
  /** What the couple has actually set, so the tiles show their own mark. */
  monogram: string;
  groom: string;
  bride: string;
  onChange: (id: string) => void;
}) {
  const current = monogramFont(value);
  /*
   * Each group previews in its own script.
   *
   * A couple whose monogram is `S&L` looking at the Khmer ten would otherwise
   * see ten tiles of Moul's *Latin* — which tells them nothing about the face
   * they are actually considering, since a Khmer display face's Latin is an
   * afterthought and its Khmer is the whole point. Where the monogram has no
   * letters of the group's script, the tile falls back to the couple's own
   * names, which on this invitation are Khmer.
   */
  const has = { latin: /[A-Za-z]/.test(monogram), khmer: /[\u1780-\u17FF]/.test(monogram) };

  return (
    <div className="space-y-5">
      {(["latin", "khmer"] as const).map((script) => (
        <section key={script}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {script === "latin" ? "អក្សរឡាតាំង · English" : "អក្សរខ្មែរ · Khmer"}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {MONOGRAM_FONTS.filter((f) => f.script === script).map((f) => {
              const on = f.id === current.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChange(f.id)}
                  aria-pressed={on}
                  title={f.note}
                  className={`flex flex-col items-center rounded-xl border p-2 text-center transition ${
                    on
                      ? "border-amber-500 bg-amber-50 ring-1 ring-amber-400"
                      : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40"
                  }`}
                >
                  <Monogram
                    text={has[script] ? monogram : script === "latin" ? "S&L" : ""}
                    groom={groom}
                    bride={bride}
                    font={f.id}
                    className="h-20 w-20 text-amber-700"
                  />
                  <span className="mt-1 block text-[11px] font-medium leading-tight text-slate-700">
                    {f.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-slate-400">
                    {f.note}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

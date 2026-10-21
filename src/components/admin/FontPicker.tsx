"use client";

import fonts from "@/lib/khmer-fonts.json";

type KhmerFont = { family: string; role: "heading" | "text"; note: string; license: string };

const FONTS = fonts as KhmerFont[];

/**
 * A typeface picker that shows each face in itself: the families are listed
 * in two groups — ceremonial / display faces for headings, and faces made
 * for reading — with the group that suits this slot first, each one setting
 * a line of the invitation's own Khmer in its own type.
 *
 * Every face is self-hosted (public/fonts/khmer, scripts/khmer-fonts.py), so
 * what the couple sees here is exactly what their guests will see.
 */
export function FontPicker({
  value,
  onChange,
  prefer,
  sample,
}: {
  /** Stored as a CSS family: `'Khmer OS Muol Light'`. */
  value: string;
  onChange: (value: string) => void;
  prefer: "heading" | "text";
  sample: string;
}) {
  const groups: { role: KhmerFont["role"]; title: string }[] =
    prefer === "heading"
      ? [
          { role: "heading", title: "សម្រាប់ចំណងជើង · Display" },
          { role: "text", title: "សម្រាប់អត្ថបទ · Text" },
        ]
      : [
          { role: "text", title: "សម្រាប់អត្ថបទ · Text" },
          { role: "heading", title: "សម្រាប់ចំណងជើង · Display" },
        ];
  const current = value.replace(/'/g, "");
  return (
    <div className="max-h-[26rem] space-y-4 overflow-y-auto rounded-xl border border-slate-200 p-3">
      {groups.map((g) => (
        <div key={g.role}>
          <p className="mb-2 text-xs font-medium text-slate-500">{g.title}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FONTS.filter((f) => f.role === g.role).map((f) => {
              const chosen = current === f.family;
              return (
                <button
                  key={f.family}
                  type="button"
                  onClick={() => onChange(`'${f.family}'`)}
                  aria-pressed={chosen}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    chosen ? "border-amber-500 bg-amber-50/70 ring-1 ring-amber-300" : "border-slate-200 hover:border-amber-300"
                  }`}
                >
                  <span className="block truncate text-lg leading-[2]" style={{ fontFamily: `'${f.family}', serif` }}>
                    {sample}
                  </span>
                  <span className="block text-xs text-slate-700">{f.family}</span>
                  <span className="block text-[0.7rem] leading-relaxed text-slate-400">{f.note}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

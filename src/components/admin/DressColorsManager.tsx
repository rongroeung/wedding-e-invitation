"use client";

import { useState } from "react";
import type { DressColor, Wedding } from "@/lib/db/schema";
import { MAX_DRESS_COLORS, dressPalette, luminance } from "@/lib/dressColors";
import { Button, Card, Field, Input, StatusMessage, Textarea, Toggle, useApi } from "./ui";

/**
 * ពណ៌សម្លៀកបំពាក់ — the wedding's colours, so guests can dress to match.
 *
 * Up to eight colours, each with an optional name, in the order they should
 * appear. The section stays off the invitation until there is at least one.
 */
export function DressColorsManager({ wedding }: { wedding: Wedding }) {
  const { busy, message, send } = useApi();
  const [enabled, setEnabled] = useState(wedding.dressCodeEnabled);
  const [title, setTitle] = useState(wedding.dressCodeTitle);
  const [note, setNote] = useState(wedding.dressCodeNote);
  const [colors, setColors] = useState<DressColor[]>(dressPalette(wedding.dressColors));

  const update = (i: number, patch: Partial<DressColor>) =>
    setColors((list) => list.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const move = (i: number, by: number) =>
    setColors((list) => {
      const j = i + by;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const valid = colors.every((c) => /^#[0-9a-f]{6}$/i.test(c.hex));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">ពណ៌សម្លៀកបំពាក់</h1>
        <p className="mt-1 text-sm text-slate-500">
          ពណ៌នៃពិធីមង្គលការ ដើម្បីឱ្យភ្ញៀវជ្រើសរើសសម្លៀកបំពាក់ឱ្យត្រូវគ្នា
          <span className="block text-xs text-slate-400">Your wedding colours, so guests can dress to match.</span>
        </p>
      </header>

      <StatusMessage message={message} />

      <Card title="ការកំណត់">
        <div className="space-y-5">
          <Toggle
            label="បង្ហាញផ្នែកពណ៌សម្លៀកបំពាក់"
            hint="ផ្នែកនេះបង្ហាញតែពេលមានពណ៌យ៉ាងតិចមួយ"
            checked={enabled}
            onChange={setEnabled}
          />
          <Field label="ចំណងជើង">
            <Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="សារជូនភ្ញៀវ (ស្រេចចិត្ត)" hint="ឧ. ពណ៌ដែលសូមឱ្យស្លៀក ឬពណ៌ដែលសូមជៀសវាង">
            <Textarea rows={2} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card
        title={`ពណ៌ (${colors.length}/${MAX_DRESS_COLORS})`}
        description="ជ្រើសពណ៌ ហើយដាក់ឈ្មោះ (ស្រេចចិត្ត) · Pick a colour and, if you like, name it"
      >
        <div className="space-y-3">
          {colors.length === 0 && <p className="text-sm text-slate-400">មិនទាន់មានពណ៌</p>}
          {colors.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2.5">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#000000"}
                onChange={(e) => update(i, { hex: e.target.value })}
                aria-label={`ពណ៌ទី ${i + 1}`}
                className="h-10 w-12 shrink-0 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
              />
              <Input
                value={c.hex}
                onChange={(e) => update(i, { hex: e.target.value.trim() })}
                aria-label="Hex"
                className="!w-28 font-mono"
                maxLength={7}
              />
              <Input
                value={c.name}
                placeholder="ឈ្មោះពណ៌ ឧ. ខៀវស្រាល"
                maxLength={40}
                onChange={(e) => update(i, { name: e.target.value })}
                aria-label="ឈ្មោះពណ៌"
                className="min-w-[10rem] flex-1"
              />
              <div className="flex gap-1">
                <Button type="button" variant="ghost" className="!px-2.5" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  ↑
                </Button>
                <Button type="button" variant="ghost" className="!px-2.5" onClick={() => move(i, 1)} disabled={i === colors.length - 1} aria-label="Move down">
                  ↓
                </Button>
                <Button type="button" variant="danger" className="!px-2.5" onClick={() => setColors((l) => l.filter((_, k) => k !== i))} aria-label="Remove">
                  ✕
                </Button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              disabled={colors.length >= MAX_DRESS_COLORS}
              onClick={() => setColors((l) => [...l, { hex: "#c29a5b", name: "" }])}
            >
              + បន្ថែមពណ៌
            </Button>
            <Button
              type="button"
              disabled={busy || !valid}
              onClick={() =>
                send("/api/admin/wedding", {
                  method: "PUT",
                  body: JSON.stringify({
                    dressCodeEnabled: enabled,
                    dressCodeTitle: title,
                    dressCodeNote: note,
                    dressColors: colors.map((c) => ({ hex: c.hex.toLowerCase(), name: c.name.trim() })),
                  }),
                  successText: "បានរក្សាទុក",
                })
              }
            >
              រក្សាទុក
            </Button>
          </div>
          {!valid && <p className="text-xs text-red-600">លេខកូដពណ៌ត្រូវជាទម្រង់ #RRGGBB</p>}
        </div>
      </Card>

      {colors.length > 0 && valid && (
        <Card title="ការបង្ហាញជាមុន">
          <div className="rounded-xl bg-[#f8f2e7] px-4 py-8">
            <p className="mb-6 text-center text-base text-[#7b5a2e]">{title || "ពណ៌សម្លៀកបំពាក់"}</p>
            {note && <p className="mx-auto mb-6 max-w-md text-center text-sm text-slate-600">{note}</p>}
            <ul
              className="dress-palette"
              role="list"
              style={{ "--cols": colors.length <= 5 ? colors.length : Math.ceil(colors.length / 2) } as React.CSSProperties}
            >
              {colors.map((c, i) => (
                <li key={i} className="dress-swatch">
                  <span
                    className="dress-chip"
                    data-pale={luminance(c.hex) > 0.72 ? "" : undefined}
                    style={{ "--chip": c.hex } as React.CSSProperties}
                  />
                  {c.name && <span className="dress-name text-slate-700">{c.name}</span>}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}

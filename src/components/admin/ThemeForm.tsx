"use client";

import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { Button, Card, Field, Input, Select, StatusMessage, useApi } from "./ui";

const PRESETS = [
  { name: "មាស & ទឹកក្រូចឈូក (លំនាំដើម)", colorPrimary: "#7B1F2F", colorSecondary: "#C8A24A", colorAccent: "#E4CE9B", colorBackground: "#FBF7F0", colorText: "#3E2A20" },
  { name: "មាសសុទ្ធ & ខ្មៅត្នោត", colorPrimary: "#4A3226", colorSecondary: "#B8912F", colorAccent: "#EADFC0", colorBackground: "#FAF6EF", colorText: "#33241C" },
  { name: "ផ្កាឈូកស្រាល", colorPrimary: "#8C3A4A", colorSecondary: "#CBA76B", colorAccent: "#F0D9DA", colorBackground: "#FDF7F5", colorText: "#412A2C" },
  { name: "បៃតងមរកត & មាស", colorPrimary: "#1F4D3D", colorSecondary: "#C2A353", colorAccent: "#DCE7DC", colorBackground: "#F8F7F0", colorText: "#26332C" },
];

const FONTS = [
  "'Noto Serif Khmer'",
  "'Noto Sans Khmer'",
  "'Khmer OS Siemreap'",
  "'Khmer OS Muol Light'",
];

/** Colour palette, fonts and decorative pattern. */
export function ThemeForm({ wedding }: { wedding: Wedding }) {
  const { busy, message, send } = useApi();
  const [form, setForm] = useState({
    colorPrimary: wedding.colorPrimary,
    colorSecondary: wedding.colorSecondary,
    colorAccent: wedding.colorAccent,
    colorBackground: wedding.colorBackground,
    colorText: wedding.colorText,
    fontHeading: wedding.fontHeading,
    fontBody: wedding.fontBody,
    pattern: wedding.pattern,
  });

  const colors: [keyof typeof form, string][] = [
    ["colorPrimary", "ពណ៌ចម្បង (អក្សរសំខាន់)"],
    ["colorSecondary", "ពណ៌មាស"],
    ["colorAccent", "ពណ៌រង (Champagne)"],
    ["colorBackground", "ពណ៌ផ្ទៃខាងក្រោយ"],
    ["colorText", "ពណ៌អក្សរ"],
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">រូបរាង</h1>
        <p className="mt-1 text-sm text-slate-500">ពណ៌ ពុម្ពអក្សរ និងលំនាំតុបតែងនៃសំបុត្រអញ្ជើញ</p>
      </header>

      <StatusMessage message={message} />

      <Card title="ឈុតពណ៌សម្រេច">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setForm({ ...form, ...preset, name: undefined } as typeof form)}
              className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-amber-400"
            >
              <div className="flex gap-1">
                {[preset.colorPrimary, preset.colorSecondary, preset.colorAccent, preset.colorBackground].map((c) => (
                  <span key={c} className="h-6 w-6 rounded-full border border-slate-200" style={{ background: c }} />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-600">{preset.name}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card title="ពណ៌">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colors.map(([key, label]) => (
            <Field key={key} label={label}>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form[key] as string}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
                  aria-label={label}
                />
                <Input value={form[key] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            </Field>
          ))}
        </div>
      </Card>

      <Card title="ពុម្ពអក្សរ និងលំនាំ">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="ពុម្ពអក្សរចំណងជើង">
            <Select value={form.fontHeading} onChange={(e) => setForm({ ...form, fontHeading: e.target.value })}>
              {FONTS.map((font) => <option key={font} value={font}>{font.replace(/'/g, "")}</option>)}
            </Select>
          </Field>
          <Field label="ពុម្ពអក្សរអត្ថបទ">
            <Select value={form.fontBody} onChange={(e) => setForm({ ...form, fontBody: e.target.value })}>
              {FONTS.map((font) => <option key={font} value={font}>{font.replace(/'/g, "")}</option>)}
            </Select>
          </Field>
          <Field label="លំនាំតុបតែង">
            <Select value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })}>
              <option value="lotus">ផ្កាឈូក</option>
              <option value="angkor">អង្គរ</option>
              <option value="floral">ផ្កាភ្ជាប់</option>
              <option value="none">គ្មាន</option>
            </Select>
          </Field>
        </div>

        <div
          className="mt-6 rounded-xl border p-6 text-center"
          style={{ background: form.colorBackground, borderColor: form.colorAccent }}
        >
          <p style={{ color: form.colorSecondary, fontFamily: form.fontHeading }} className="text-lg">
            សិរីមង្គលអាពាហ៍ពិពាហ៍
          </p>
          <p style={{ color: form.colorPrimary, fontFamily: form.fontHeading }} className="mt-2 text-xl">
            {wedding.groomName} &amp; {wedding.brideName}
          </p>
          <p style={{ color: form.colorText, fontFamily: form.fontBody }} className="mt-2 text-sm">
            {wedding.weddingDateKhmer}
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            disabled={busy}
            onClick={() => send("/api/admin/wedding", { method: "PUT", body: JSON.stringify(form), successText: "បានរក្សាទុករូបរាង" })}
          >
            រក្សាទុក
          </Button>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { OrnamentBand, type BandMotif } from "@/components/ui/OrnamentBand";
import { mediaSrc } from "@/lib/media";
import { BUILTIN_BAND_ART, CORNER_ART } from "@/lib/frame";
import { Button, Card, Field, Input, MediaUpload, Select, StatusMessage, Toggle, useApi } from "./ui";

const PRESETS = [
  { name: "ក្រដាស & មាសបុរាណ (លំនាំដើម)", colorPrimary: "#4A3527", colorSecondary: "#C29A5B", colorAccent: "#E3D3B8", colorBackground: "#F6F3EE", colorText: "#4A3A2C" },
  { name: "ត្នោតខ្លាំង & មាស", colorPrimary: "#3B2A1D", colorSecondary: "#B8935A", colorAccent: "#E7DAC2", colorBackground: "#F4F1EA", colorText: "#3F3125" },
  { name: "ទឹកក្រូចឈូក & មាស", colorPrimary: "#7B1F2F", colorSecondary: "#C8A24A", colorAccent: "#E4CE9B", colorBackground: "#FBF7F0", colorText: "#3E2A20" },
  { name: "បៃតងមរកត & មាស", colorPrimary: "#1F4D3D", colorSecondary: "#C2A353", colorAccent: "#DCE7DC", colorBackground: "#F8F7F0", colorText: "#26332C" },
];

const HEADING_FONTS = [
  "'Khmer OS Muol Light'",
  "'Moul'",
  "'Noto Serif Khmer'",
  "'Khmer OS Muol'",
];

const BODY_FONTS = [
  "'Noto Sans Khmer'",
  "'Noto Serif Khmer'",
  "'Khmer OS Siemreap'",
  "'Khmer OS Battambang'",
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
    frameSource: wedding.frameSource,
    frameMotif: wedding.frameMotif,
    frameLayout: wedding.frameLayout,
    frameTopMediaId: wedding.frameTopMediaId,
    frameTopUrl: wedding.frameTopUrl,
    frameBottomMediaId: wedding.frameBottomMediaId,
    frameBottomUrl: wedding.frameBottomUrl,
    frameMirrorBottom: wedding.frameMirrorBottom,
    frameSideRules: wedding.frameSideRules,
  });

  const colors: [keyof typeof form, string][] = [
    ["colorPrimary", "ពណ៌ចម្បង (ឈ្មោះ និងប៊ូតុង)"],
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

      <Card
        title="ស៊ុមសំបុត្រ"
        description="ប្រើក្បាច់សម្រេច ឬផ្ទុកក្បាច់ផ្ទាល់ខ្លួនរបស់លោកអ្នក"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: "builtin", title: "ក្បាច់សម្រេច", text: "ជ្រើសរើសពីក្បាច់ដែលមានស្រាប់" },
            { value: "custom", title: "ក្បាច់ផ្ទាល់ខ្លួន", text: "ផ្ទុករូបភាពក្បាច់របស់លោកអ្នក" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setForm({ ...form, frameSource: option.value })}
              className={`rounded-xl border p-4 text-left transition ${
                form.frameSource === option.value
                  ? "border-amber-500 bg-amber-50/60 ring-1 ring-amber-300"
                  : "border-slate-200 hover:border-amber-300"
              }`}
              aria-pressed={form.frameSource === option.value}
            >
              <p className="text-sm font-medium text-slate-800">{option.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{option.text}</p>
            </button>
          ))}
        </div>

        {form.frameSource === "builtin" ? (
          <div className="mt-5">
            <Field label="ក្បាច់">
              <Select value={form.frameMotif} onChange={(e) => setForm({ ...form, frameMotif: e.target.value })}>
                <optgroup label="ក្បាច់រូបភាព">
                  <option value="kbach">ក្បាច់ខ្មែរមាស</option>
                </optgroup>
                <optgroup label="ក្បាច់ជ្រុង (៤ ជ្រុង)">
                  <option value="royal">ក្បាច់ផ្កាមាស</option>
                  <option value="royal-light">ក្បាច់ផ្កាមាស (ស្រាល)</option>
                </optgroup>
                <optgroup label="ក្បាច់គូរដោយកម្មវិធី">
                  <option value="lotus">ផ្កាឈូក</option>
                  <option value="flame">ក្បាច់អណ្តាតភ្លើង</option>
                  <option value="angkor">ប្រាសាទអង្គរវត្ត</option>
                  <option value="wheel">ធម្មចក្រ</option>
                </optgroup>
              </Select>
            </Field>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <Field label="ទម្រង់ដាក់ក្បាច់">
              <Select value={form.frameLayout} onChange={(e) => setForm({ ...form, frameLayout: e.target.value })}>
                <option value="band">ខាងលើ និងខាងក្រោម (band)</option>
                <option value="corner">៤ ជ្រុង (corner)</option>
              </Select>
            </Field>

            <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
              <p className="font-medium text-slate-700">អ្វីដែលត្រូវផ្ទុក</p>
              <p className="mt-1">
                រូបភាព PNG ដែលមានផ្ទៃខាងក្រោយថ្លា (transparent) ឬ SVG។ ទទឹងណែនាំ ១២០០–២០០០px។
                កម្ពស់អាចជាប៉ុន្មានក៏បាន — ប្រព័ន្ធនឹងតម្រូវតាមទទឹងសំបុត្រដោយស្វ័យប្រវត្តិ។
                {form.frameLayout === "corner"
                  ? "ផ្ទុកតែក្បាច់ជ្រុងខាងលើ–ឆ្វេង ១ ប៉ុណ្ណោះ — ប្រព័ន្ធនឹងបញ្ច្រាសវាសម្រាប់ជ្រុងទាំង ៣ ទៀត។"
                  : "កុំដាក់ស៊ុមពេញ ៤ ជ្រុងក្នុងរូបតែមួយ — ផ្ទុកតែផ្នែកខាងលើប៉ុណ្ណោះ ហើយប្រព័ន្ធនឹងបញ្ច្រាសវាសម្រាប់ខាងក្រោម។"}
              </p>
            </div>

            <MediaUpload
              label="ក្បាច់ខាងលើ"
              currentSrc={mediaSrc(form.frameTopMediaId, form.frameTopUrl)}
              onUploaded={(id) => setForm({ ...form, frameTopMediaId: id, frameTopUrl: "" })}
              onClear={() => setForm({ ...form, frameTopMediaId: null, frameTopUrl: "" })}
            />
            <Field label="ឬបញ្ចូល URL រូបភាពក្បាច់ខាងលើ">
              <Input
                value={form.frameTopUrl}
                placeholder="https://..."
                onChange={(e) => setForm({ ...form, frameTopUrl: e.target.value })}
              />
            </Field>

            {form.frameLayout === "band" && (
            <Toggle
              label="បញ្ច្រាសក្បាច់ខាងលើសម្រាប់ខាងក្រោម"
              hint="បិទប្រសិនបើលោកអ្នកចង់ផ្ទុកក្បាច់ខាងក្រោមផ្សេង"
              checked={form.frameMirrorBottom}
              onChange={(v) => setForm({ ...form, frameMirrorBottom: v })}
            />

            )}

            {form.frameLayout === "band" && !form.frameMirrorBottom && (
              <>
                <MediaUpload
                  label="ក្បាច់ខាងក្រោម"
                  currentSrc={mediaSrc(form.frameBottomMediaId, form.frameBottomUrl)}
                  onUploaded={(id) => setForm({ ...form, frameBottomMediaId: id, frameBottomUrl: "" })}
                  onClear={() => setForm({ ...form, frameBottomMediaId: null, frameBottomUrl: "" })}
                />
                <Field label="ឬបញ្ចូល URL រូបភាពក្បាច់ខាងក្រោម">
                  <Input
                    value={form.frameBottomUrl}
                    placeholder="https://..."
                    onChange={(e) => setForm({ ...form, frameBottomUrl: e.target.value })}
                  />
                </Field>
              </>
            )}
          </div>
        )}

        {frameLayoutOf(form) === "band" && !BUILTIN_BAND_ART[form.frameMotif as string] && form.frameSource !== "custom" && (
          <div className="mt-5">
            <Toggle
              label="បន្ទាត់ចំហៀងភ្ជាប់ក្បាច់ខាងលើ និងខាងក្រោម"
              checked={form.frameSideRules}
              onChange={(v) => setForm({ ...form, frameSideRules: v })}
            />
          </div>
        )}

        <FramePreview form={form} wedding={wedding} />
      </Card>

      <Card title="ពុម្ពអក្សរ និងលំនាំ">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="ពុម្ពអក្សរចំណងជើង" hint="Khmer OS Muol Light ភ្ជាប់មកជាមួយកម្មវិធី">
            <Select value={form.fontHeading} onChange={(e) => setForm({ ...form, fontHeading: e.target.value })}>
              {HEADING_FONTS.map((font) => <option key={font} value={font}>{font.replace(/'/g, "")}</option>)}
            </Select>
          </Field>
          <Field label="ពុម្ពអក្សរអត្ថបទ" hint="សូមកុំប្រើ Muol សម្រាប់អត្ថបទវែង">
            <Select value={form.fontBody} onChange={(e) => setForm({ ...form, fontBody: e.target.value })}>
              {BODY_FONTS.map((font) => <option key={font} value={font}>{font.replace(/'/g, "")}</option>)}
            </Select>
          </Field>
          <Field label="លំនាំផ្ទៃខាងក្រោយ">
            <Select value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })}>
              <option value="none">គ្មាន (ណែនាំ)</option>
              <option value="lotus">ផ្កាឈូក</option>
              <option value="angkor">អង្គរ</option>
              <option value="floral">ផ្កាភ្ជាប់</option>
            </Select>
          </Field>
        </div>

        <div
          className="mt-6 rounded-xl border px-6 py-8 text-center"
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

/** Which layout the current form settings resolve to. */
function frameLayoutOf(form: Record<string, unknown>): "band" | "corner" {
  if (form.frameSource === "custom") return form.frameLayout === "corner" ? "corner" : "band";
  return CORNER_ART[form.frameMotif as string] ? "corner" : "band";
}

/** Shows the chosen frame around a miniature of the card. */
function FramePreview({
  form,
  wedding,
}: {
  form: Record<string, unknown>;
  wedding: Wedding;
}) {
  const custom = form.frameSource === "custom";
  const builtinBand = custom ? undefined : BUILTIN_BAND_ART[form.frameMotif as string];
  const uploadedTop = mediaSrc(form.frameTopMediaId as string | null, form.frameTopUrl as string);
  const uploadedBottom = mediaSrc(form.frameBottomMediaId as string | null, form.frameBottomUrl as string);
  const top = custom ? uploadedTop : (builtinBand?.top ?? "");
  const bottom = custom ? uploadedBottom : (builtinBand?.bottom ?? "");
  const mirror = custom && !uploadedBottom && (form.frameMirrorBottom as boolean);
  const layout = frameLayoutOf(form);
  const corner = custom ? uploadedTop : CORNER_ART[form.frameMotif as string];
  const bandArt = Boolean(top);

  if (custom && !uploadedTop) {
    return (
      <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
        ផ្ទុកក្បាច់ ដើម្បីមើលការបង្ហាញជាមុន។ បើមិនទាន់ផ្ទុកទេ ប្រព័ន្ធនឹងប្រើក្បាច់សម្រេច។
      </p>
    );
  }

  const surface = {
    background: form.colorBackground as string,
    borderColor: form.colorAccent as string,
  };

  return (
    <div className="mt-5">
      <p className="mb-2 text-sm font-medium text-slate-700">ការបង្ហាញជាមុន</p>

      {layout === "corner" ? (
        <div className="relative mx-auto aspect-[3/4] max-w-sm overflow-hidden rounded-lg border" style={surface}>
          {/* eslint-disable @next/next/no-img-element */}
          <img src={corner} alt="" className="absolute left-0 top-0 w-[46%]" />
          <img src={corner} alt="" className="absolute right-0 top-0 w-[46%] -scale-x-100" />
          <img src={corner} alt="" className="absolute bottom-0 left-0 w-[46%] -scale-y-100" />
          <img src={corner} alt="" className="absolute bottom-0 right-0 w-[46%] -scale-100" />
          {/* eslint-enable @next/next/no-img-element */}
          <p
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-base"
            style={{ color: form.colorPrimary as string, fontFamily: form.fontHeading as string }}
          >
            {wedding.groomName} &amp; {wedding.brideName}
          </p>
        </div>
      ) : (
        <div className="mx-auto flex max-w-sm flex-col overflow-hidden rounded-lg border" style={surface}>
          <div style={{ color: form.colorSecondary as string }}>
            {bandArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={top} alt="" className="w-full" />
            ) : (
              <OrnamentBand motif={form.frameMotif as BandMotif} className="w-full" />
            )}
          </div>

          <div
            className={`mx-[1.6%] flex-1 px-4 py-10 text-center ${!bandArt && form.frameSideRules ? "border-x" : ""}`}
            style={{ borderColor: `${form.colorSecondary as string}59` }}
          >
            <p
              className="text-base"
              style={{ color: form.colorPrimary as string, fontFamily: form.fontHeading as string }}
            >
              {wedding.groomName} &amp; {wedding.brideName}
            </p>
          </div>

          <div style={{ color: form.colorSecondary as string }}>
            {bandArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bottom || top} alt="" className={`w-full ${mirror ? "-scale-y-100" : ""}`} />
            ) : (
              <OrnamentBand motif={form.frameMotif as BandMotif} flip className="w-full" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

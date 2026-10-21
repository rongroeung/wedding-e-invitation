"use client";

import { FontPicker } from "./FontPicker";
import { PAPER_GROUPS } from "@/lib/paperThemes";
import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { FrameArt } from "@/components/ui/FrameArt";
import { mediaSrc } from "@/lib/media";
import { BUILTIN_BAND_ART, CORNER_ART, FRAME_LABELS, FRAME_MOTIFS } from "@/lib/frame";
import { DESIGN_KITS, DESIGN_KIT_KEYS, designKitOf } from "@/lib/designKit";
import { BACKDROP_PRESETS, BACKDROP_PRESET_KEYS } from "@/lib/backgrounds";
import { FX_LEVELS, FX_LEVEL_KEYS, FX_MODES, FX_MODE_KEYS, PAPER_THEMES, PAPER_THEME_KEYS } from "@/lib/appearance";
import { ArtworkField, Button, Card, Field, Input, MediaUpload, Select, StatusMessage, Toggle, useApi } from "./ui";

const PRESETS = [
  { name: "ក្រដាស & មាសបុរាណ (លំនាំដើម)", colorPrimary: "#4A3527", colorSecondary: "#C29A5B", colorAccent: "#E3D3B8", colorBackground: "#F6F3EE", colorText: "#4A3A2C" },
  { name: "ត្នោតខ្លាំង & មាស", colorPrimary: "#3B2A1D", colorSecondary: "#B8935A", colorAccent: "#E7DAC2", colorBackground: "#F4F1EA", colorText: "#3F3125" },
  { name: "ទឹកក្រូចឈូក & មាស", colorPrimary: "#7B1F2F", colorSecondary: "#C8A24A", colorAccent: "#E4CE9B", colorBackground: "#FBF7F0", colorText: "#3E2A20" },
  { name: "បៃតងមរកត & មាស", colorPrimary: "#1F4D3D", colorSecondary: "#C2A353", colorAccent: "#DCE7DC", colorBackground: "#F8F7F0", colorText: "#26332C" },
  /*
   * The two pinks are built the same way as the others: the background stays a
   * *paper* — barely tinted, so the fibre and the emboss still read on it — and
   * all the colour goes into the primary and the accent. A saturated pink page
   * with pale pink type looks like a greetings card; a blush sheet with deep
   * plum type printed on it looks like stationery.
   */
  { name: "ផ្កាឈូកស្រាល & មាស", colorPrimary: "#6E3140", colorSecondary: "#C8A05E", colorAccent: "#F2D9DC", colorBackground: "#FCF4F3", colorText: "#4E3138" },
  { name: "ផ្កាឈូក & មាសរ៉ូស", colorPrimary: "#8A4356", colorSecondary: "#C9906F", colorAccent: "#EBD3D6", colorBackground: "#FDF6F4", colorText: "#4A3238" },
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
    designKit: designKitOf(wedding.designKit).key as string,
    frameLayout: wedding.frameLayout,
    frameTopMediaId: wedding.frameTopMediaId,
    frameTopUrl: wedding.frameTopUrl,
    frameBottomMediaId: wedding.frameBottomMediaId,
    frameBottomUrl: wedding.frameBottomUrl,
    frameMirrorBottom: wedding.frameMirrorBottom,
    frameSideRules: wedding.frameSideRules,
    frameTint: wedding.frameTint,
    frameSticky: wedding.frameSticky,
    frameScale: wedding.frameScale,
    fontScale: wedding.fontScale,

    pageBgMediaId: wedding.pageBgMediaId,
    pageBgFit: wedding.pageBgFit,
    pageBgScrim: wedding.pageBgScrim,
    pageBgPreset: wedding.pageBgPreset,

    cardBgMediaId: wedding.cardBgMediaId,
    cardBgFit: wedding.cardBgFit,
    cardBgScrim: wedding.cardBgScrim,
    cardBgPreset: wedding.cardBgPreset,
    appearancePaper: wedding.appearancePaper,
    appearanceFx: wedding.appearanceFx,
    appearanceLevel: wedding.appearanceLevel,
    appearanceGuestPanel: wedding.appearanceGuestPanel,
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
        title="ឈុតក្បាច់តុបតែង"
        description="ក្បាច់ទាំងមូលនៃសំបុត្រ — ក្បាច់កំពូល ខ្សែខណ្ឌក្រោមចំណងជើង ក្បាច់តូចៗ ត្រាក្រមួន និងក្បាច់លើស្រោមសំបុត្រ។ ការជ្រើសរើសឈុតនឹងប្តូរស៊ុមទៅតាមឈុតផងដែរ។"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DESIGN_KIT_KEYS.map((key) => {
            const kit = DESIGN_KITS[key];
            const chosen = form.designKit === key;
            const art = kit.ornaments;
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    designKit: key,
                    // the kit brings its own frame, unless the couple uses their own
                    ...(form.frameSource === "builtin" ? { frameMotif: kit.frame } : {}),
                  })
                }
                className={`rounded-xl border p-4 text-left transition ${
                  chosen ? "border-amber-500 bg-amber-50/60 ring-1 ring-amber-300" : "border-slate-200 hover:border-amber-300"
                }`}
                aria-pressed={chosen}
              >
                <div
                  className="flex h-24 items-center justify-center gap-3 overflow-hidden rounded-lg border px-3"
                  style={{ background: form.colorBackground, borderColor: form.colorAccent }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art.crest.src} alt="" className="h-9 w-auto max-w-[42%] object-contain" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art.title.src} alt="" className="h-6 w-auto max-w-[36%] object-contain" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art.rosette.src} alt="" className="h-7 w-auto max-w-[16%] object-contain" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-800">{kit.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{kit.note}</p>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">ចុច «រក្សាទុក» នៅខាងក្រោមទំព័រ ដើម្បីអនុវត្ត។</p>
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
              <Select
                value={(FRAME_MOTIFS as readonly string[]).includes(form.frameMotif) ? form.frameMotif : FRAME_MOTIFS[0]}
                onChange={(e) => setForm({ ...form, frameMotif: e.target.value })}
              >
                {FRAME_MOTIFS.map((motif) => (
                  <option key={motif} value={motif}>
                    {FRAME_LABELS[motif]}
                  </option>
                ))}
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

        <div className="mt-5 space-y-4">
          <Field
            label={`ទំហំក្បាច់ · ${form.frameScale}%`}
            hint="កាត់បន្ថយ ដើម្បីឱ្យក្បាច់តូច និងទុកកន្លែងច្រើនសម្រាប់អត្ថបទ"
          >
            <input
              type="range"
              min={30}
              max={100}
              step={5}
              value={form.frameScale as number}
              onChange={(e) => setForm({ ...form, frameScale: Number(e.target.value) })}
              className="w-full accent-amber-600"
            />
          </Field>

          <Toggle
            label="ក្បាច់ជាប់នឹងអេក្រង់ (sticky)"
            hint="ក្បាច់នៅនឹងកន្លែង ហើយអត្ថបទរំកិលនៅខាងក្នុង។ បើបិទ ទាំងអស់រំកិលជាមួយគ្នា"
            checked={form.frameSticky as boolean}
            onChange={(v) => setForm({ ...form, frameSticky: v })}
          />

          <Toggle
            label="ធ្វើឱ្យក្បាច់មានពណ៌ដូចចំណងជើង"
            hint="ប្តូរពណ៌មាសរបស់ក្បាច់ទៅជាពណ៌ចំណងជើង ដោយរក្សាស្រមោល និងពន្លឺដដែល"
            checked={form.frameTint}
            onChange={(v) => setForm({ ...form, frameTint: v })}
          />
        </div>

        <FramePreview form={form} wedding={wedding} />
      </Card>

      <Card
        title="ក្រដាស និងចលនា"
        description="ក្រដាសដែលសំបុត្របោះពុម្ព រូបភាពផ្ទៃខាងក្រោយ និងចលនាស្រាលៗពីលើ (ក៏ដូចជាពីក្រោយស្រោមសំបុត្រ)។ នេះជាការកំណត់លំនាំដើម — ភ្ញៀវអាចប្តូរសម្រាប់ខ្លួនឯងពីប៊ូតុងតូចលើសំបុត្រ បើលោកអ្នកអនុញ្ញាត។"
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">ក្រដាស</p>
            {[...PAPER_GROUPS, { key: "own" as const, km: "ផ្ទាល់ខ្លួន", en: "Your own" }].map((g) => (
              <div key={g.key} className="mb-4">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  {g.km} · {g.en}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {PAPER_THEME_KEYS.filter((key) => PAPER_THEMES[key].group === g.key).map((key) => {
                    const chosen = form.appearancePaper === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, appearancePaper: key })}
                        className={`overflow-hidden rounded-xl border text-left transition ${
                          chosen ? "border-amber-500 ring-2 ring-amber-300" : "border-slate-200 hover:border-amber-300"
                        }`}
                        aria-pressed={chosen}
                      >
                        <span
                          className="block h-16 bg-cover bg-center"
                          style={{
                            backgroundImage:
                              key === "couple"
                                ? "repeating-linear-gradient(135deg,#efe7da 0 8px,#f7f1e7 8px 16px)"
                                : `url("/paper/swatch/${key}.webp")`,
                          }}
                        />
                        <span className="block px-3 py-2 text-xs text-slate-700">
                          {PAPER_THEMES[key].km}
                          <span className="block text-slate-400">
                            {key === "couple" ? "រូបភាព ឬលំនាំផ្ទាល់ខ្លួន (ខាងក្រោម)" : PAPER_THEMES[key].en}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-sm font-medium text-slate-700">ក្រដាសរបស់គូស្វាមីភរិយា — រូបភាព ឬលំនាំផ្ទាល់ខ្លួន</p>
            <p className="mb-4 mt-1 text-xs text-slate-500">
              ជ្រើសលំនាំ ឬផ្ទុករូបឡើង ដើម្បីប្រើជាក្រដាសលិខិត។ ការជ្រើសនេះនឹងប្តូរក្រដាសទៅ «ក្រដាសរបស់គូស្វាមីភរិយា» ដោយស្វ័យប្រវត្តិ។
            </p>
            <div className="space-y-6">
              <PresetPicker
                label="ផ្ទៃខាងក្រោយសំបុត្រ (ក្រដាសលិខិត) — លំនាំសម្រេច"
                value={form.cardBgMediaId ? "" : form.cardBgPreset}
                onChange={(key) =>
                  setForm({
                    ...form,
                    cardBgPreset: key,
                    // a picture for the card is the couple's own paper
                    ...(key ? { appearancePaper: "couple" } : {}),
                    // a design replaces an upload, and comes in at the wash that suits it
                    ...(key
                      ? { cardBgMediaId: null, cardBgScrim: BACKDROP_PRESETS[key as keyof typeof BACKDROP_PRESETS].cardStrength }
                      : {}),
                  })
                }
              />
              <ArtworkField
                label="ក្រដាសលិខិត"
                hint="រូបនេះនៅពីក្រោយអក្សរលិខិតផ្ទាល់។ សូមបង្កើនកម្រិតពណ៌គ្រប ដើម្បីឱ្យអក្សរនៅតែអានបាន។"
                mediaId={form.cardBgMediaId}
                preset={!form.cardBgMediaId && Boolean(form.cardBgPreset)}
                onMedia={(id) => setForm({ ...form, cardBgMediaId: id, ...(id ? { cardBgPreset: "", appearancePaper: "couple" } : {}) })}
                fit={form.cardBgFit}
                onFit={(fit) => setForm({ ...form, cardBgFit: fit })}
                strength={form.cardBgScrim}
                onStrength={(value) => setForm({ ...form, cardBgScrim: value })}
                strengthLabel={(value) => `កម្រិតពណ៌ក្រដាសគ្របលើរូប — ${value}%`}
                strengthHint="ណែនាំយ៉ាងតិច ៥០% បើរូបមានពណ៌ច្រើន"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ចលនា">
              <Select value={form.appearanceFx} onChange={(e) => setForm({ ...form, appearanceFx: e.target.value })}>
                {FX_MODE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {FX_MODES[key].km} — {FX_MODES[key].en}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="កម្រិតចលនា">
              <Select value={form.appearanceLevel} onChange={(e) => setForm({ ...form, appearanceLevel: e.target.value })}>
                {FX_LEVEL_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {FX_LEVELS[key].km} — {FX_LEVELS[key].en}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-sm font-medium text-slate-700">ផ្ទៃខាងក្រោយទំព័រ</p>
            <p className="mb-4 mt-1 text-xs text-slate-500">រូបនៅជុំវិញសំបុត្រ លើអេក្រង់ធំ (ក្រៅពីក្រដាសលិខិត)។</p>
            <div className="space-y-6">
              <PresetPicker
                label="ផ្ទៃខាងក្រោយទំព័រ (ជុំវិញសំបុត្រ លើអេក្រង់ធំ) — លំនាំសម្រេច"
                value={form.pageBgMediaId ? "" : form.pageBgPreset}
                onChange={(key) =>
                  // a design replaces an upload; choosing "none" leaves an upload alone
                  setForm({ ...form, pageBgPreset: key, ...(key ? { pageBgMediaId: null } : {}) })
                }
              />
              <ArtworkField
                label="ផ្ទៃខាងក្រោយទំព័រ"
                hint="រូបនេះនៅនឹងកន្លែង ពេលរំកិលទំព័រចុះឡើង។ វាស្ថិតនៅក្រោយអ្វីៗទាំងអស់។"
                mediaId={form.pageBgMediaId}
                preset={!form.pageBgMediaId && Boolean(form.pageBgPreset)}
                onMedia={(id) => setForm({ ...form, pageBgMediaId: id, ...(id ? { pageBgPreset: "" } : {}) })}
                fit={form.pageBgFit}
                onFit={(fit) => setForm({ ...form, pageBgFit: fit })}
                strength={form.pageBgScrim}
                onStrength={(value) => setForm({ ...form, pageBgScrim: value })}
                strengthLabel={(value) => `កម្រិតពណ៌ផ្ទៃគ្របលើរូប — ${value}%`}
                strengthHint="បង្កើន បើរូបមើលទៅខ្លាំងពេក"
              />
            </div>
          </div>

          <Toggle
            label="អនុញ្ញាតឱ្យភ្ញៀវប្តូររូបរាង"
            hint="បង្ហាញប៊ូតុងតូចនៅជ្រុងខាងក្រោម ដែលភ្ញៀវអាចជ្រើសក្រដាស និងចលនាសម្រាប់ខ្លួនឯង (រក្សាទុកតែលើឧបករណ៍របស់គេ)"
            checked={form.appearanceGuestPanel as boolean}
            onChange={(v) => setForm({ ...form, appearanceGuestPanel: v })}
          />
          <p className="text-xs text-slate-500">ចុច «រក្សាទុក» នៅខាងក្រោមទំព័រ ដើម្បីអនុវត្ត។</p>
        </div>
      </Card>

      <Card title="ពុម្ពអក្សរ និងលំនាំ">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <Field
              label={`ទំហំអក្សរទាំងមូល · ${form.fontScale}%`}
              hint="កែទំហំអក្សរ និងគម្លាតទាំងអស់ក្នុងសំបុត្រតាមសមាមាត្រ"
            >
              <input
                type="range"
                min={70}
                max={140}
                step={5}
                value={form.fontScale as number}
                onChange={(e) => setForm({ ...form, fontScale: Number(e.target.value) })}
                className="w-full accent-amber-600"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="ពុម្ពអក្សរចំណងជើង" hint="Khmer OS Muol Light ភ្ជាប់មកជាមួយកម្មវិធី">
            <FontPicker
              value={form.fontHeading}
              onChange={(v) => setForm({ ...form, fontHeading: v })}
              prefer="heading"
              sample="សិរីមង្គលអាពាហ៍ពិពាហ៍"
            />
          </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="ពុម្ពអក្សរអត្ថបទ" hint="សូមកុំប្រើ Muol សម្រាប់អត្ថបទវែង">
            <FontPicker
              value={form.fontBody}
              onChange={(v) => setForm({ ...form, fontBody: v })}
              prefer="text"
              sample="សូមគោរពអញ្ជើញចូលរួមជាអធិបតី"
            />
          </Field>
          </div>
          <Field label="លំនាំផ្ទៃខាងក្រោយ">
            <Select value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })}>
              <option value="none">គ្មាន (ណែនាំ)</option>
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

/**
 * The built-in background designs, as a row of swatches. "None" is first;
 * picking a design clears an uploaded picture for the same surface (an upload
 * would otherwise win), and uploading clears the design.
 */
function PresetPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (key: string) => void;
}) {
  const options = [
    { key: "", label: "គ្មាន", thumb: "" },
    ...BACKDROP_PRESET_KEYS.map((key) => ({ key, label: BACKDROP_PRESETS[key].label, thumb: BACKDROP_PRESETS[key].thumb })),
  ];
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((option) => {
          const chosen = value === option.key;
          return (
            <button
              key={option.key || "none"}
              type="button"
              onClick={() => onChange(option.key)}
              className={`overflow-hidden rounded-xl border text-left transition ${
                chosen ? "border-amber-500 ring-2 ring-amber-300" : "border-slate-200 hover:border-amber-300"
              }`}
              aria-pressed={chosen}
            >
              <span
                className="block aspect-[4/3] w-full bg-slate-100"
                style={option.thumb ? { background: `url(${option.thumb}) center / cover` } : undefined}
              />
              <span className="block px-3 py-2 text-xs text-slate-700">{option.label}</span>
            </button>
          );
        })}
      </div>
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
          {(() => {
            const w = { width: `${(46 * (form.frameScale as number)) / 100}%` };
            const tint = form.frameTint as boolean;
            return (
              <>
                <FrameArt src={corner} tint={tint} style={w} className="absolute left-0 top-0" />
                <FrameArt src={corner} tint={tint} style={w} className="absolute right-0 top-0 -scale-x-100" />
                <FrameArt src={corner} tint={tint} style={w} className="absolute bottom-0 left-0 -scale-y-100" />
                <FrameArt src={corner} tint={tint} style={w} className="absolute bottom-0 right-0 -scale-100" />
              </>
            );
          })()}
          <p
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-base"
            style={{ color: form.colorPrimary as string, fontFamily: form.fontHeading as string }}
          >
            {wedding.groomName} &amp; {wedding.brideName}
          </p>
        </div>
      ) : (
        <div className="mx-auto flex max-w-sm flex-col overflow-hidden rounded-lg border" style={surface}>
          <div className="flex justify-center" style={{ color: form.colorSecondary as string }}>
            <FrameArt src={top} tint={form.frameTint as boolean} style={{ width: `${form.frameScale}%` }} />
          </div>

          <div className="mx-[1.6%] flex-1 px-4 py-10 text-center">
            <p
              className="text-base"
              style={{ color: form.colorPrimary as string, fontFamily: form.fontHeading as string }}
            >
              {wedding.groomName} &amp; {wedding.brideName}
            </p>
          </div>

          <div className="flex justify-center" style={{ color: form.colorSecondary as string }}>
            <FrameArt src={bottom || top} tint={form.frameTint as boolean} flip={mirror} style={{ width: `${form.frameScale}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

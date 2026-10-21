"use client";

import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import {
  ENVELOPE_STYLE_LIST,
  envelopeConfig,
  sealInitials,
  type EnvelopeStyleKey,
} from "@/lib/envelope";
import { ArtworkField, Button, Card, Field, Input, MediaUpload, Select, StatusMessage, Toggle, useApi } from "./ui";
import { videoSource } from "@/lib/video";

/**
 * "3D Envelope" — the sealed card a guest opens before the invitation.
 *
 * Every control here is optional in the sense that turning the whole thing off
 * puts the invitation back exactly as it was, so a couple who does not want an
 * envelope loses nothing by saying so.
 */
export function EnvelopeForm({ wedding }: { wedding: Wedding }) {
  const { busy, message, send } = useApi();
  const [form, setForm] = useState({
    envelopeEnabled: wedding.envelopeEnabled,
    envelopeStyle: wedding.envelopeStyle as EnvelopeStyleKey,
    envelopePaper: wedding.envelopePaper,
    envelopeGold: wedding.envelopeGold,
    envelopeSeal: wedding.envelopeSeal,
    envelopeFlapMark: wedding.envelopeFlapMark,
    envelopeSealText: wedding.envelopeSealText,
    envelopeAnimate: wedding.envelopeAnimate,
    envelopeDuration: wedding.envelopeDuration,
    envelopeMusic: wedding.envelopeMusic,
    envelopeSkip: wedding.envelopeSkip,
    envelopeEveryVisit: wedding.envelopeEveryVisit,
    envelopeMatchPaper: wedding.envelopeMatchPaper,
    envelopeOpenLabel: wedding.envelopeOpenLabel,
    envelopeHint: wedding.envelopeHint,
    envelopeSkipLabel: wedding.envelopeSkipLabel,
    envelopeTitle: wedding.envelopeTitle,
    envelopeSubtitle: wedding.envelopeSubtitle,

    videoEnabled: wedding.videoEnabled,
    videoUrl: wedding.videoUrl,
    videoMediaId: wedding.videoMediaId,
    videoPosterId: wedding.videoPosterId,
    videoSkipLabel: wedding.videoSkipLabel,

    frameEmboss: wedding.frameEmboss,
    frameDepth: wedding.frameDepth,

    envelopeFaceMediaId: wedding.envelopeFaceMediaId,
    envelopeFaceFit: wedding.envelopeFaceFit,
    envelopeFaceScrim: wedding.envelopeFaceScrim,
    envelopeFaceOrnament: wedding.envelopeFaceOrnament,

    curtainMediaId: wedding.curtainMediaId,
    curtainMediaKind: wedding.curtainMediaKind,
    curtainPosterId: wedding.curtainPosterId,
    curtainFit: wedding.curtainFit,
    curtainFolds: wedding.curtainFolds,
    curtainEnabled: wedding.curtainEnabled,
    curtainShade: wedding.curtainShade,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* The preview resolves through exactly the same code the guest's envelope
     does, so what is shown here cannot drift from what is sent. */
  const preview = envelopeConfig({ ...wedding, ...form });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">3D Envelope &amp; Frame</h1>
        <p className="mt-1 text-sm text-slate-500">
          សំបុត្រអញ្ជើញ ៣មិតិ និងស៊ុមក្បាច់ខ្មែរមាសរបស់លិខិតអញ្ជើញ
        </p>
      </header>

      <StatusMessage message={message} />

      <Card title="បើក / បិទ">
        <div className="space-y-3">
          <Toggle
            label="បង្ហាញសំបុត្រ ៣មិតិ"
            hint="បិទ = ភ្ញៀវឃើញលិខិតអញ្ជើញដោយផ្ទាល់ ដូចមុន"
            checked={form.envelopeEnabled}
            onChange={(v) => set("envelopeEnabled", v)}
          />
          <Toggle
            label="បើកចលនា ៣មិតិ"
            hint="បិទ = បើករួច ផ្លាស់ប្ដូរដោយរលោងភ្លាមៗ (ដូចរបៀបកាត់បន្ថយចលនា)"
            checked={form.envelopeAnimate}
            onChange={(v) => set("envelopeAnimate", v)}
          />
          <Toggle
            label="បង្ហាញសំបុត្រគ្រប់ពេលចូលមើល"
            hint="បិទ = បើករួចហើយ មិនបង្ហាញម្ដងទៀតក្នុងការចូលមើលដដែល"
            checked={form.envelopeEveryVisit}
            onChange={(v) => set("envelopeEveryVisit", v)}
          />
          <Toggle
            label="បង្ហាញប៊ូតុងរំលង"
            checked={form.envelopeSkip}
            onChange={(v) => set("envelopeSkip", v)}
          />
          <Toggle
            label="ចាក់ភ្លេងបន្ទាប់ពីបើកសំបុត្រ"
            hint="ភ្លេងមិនចាក់មុនភ្ញៀវចុចឡើយ"
            checked={form.envelopeMusic}
            onChange={(v) => set("envelopeMusic", v)}
          />
        </div>
      </Card>

      <Card title="រូបរាងសំបុត្រ" description="ជ្រើសរើសម៉ូដ រួចកែពណ៌បើចង់">
        <div className="mb-5">
          <Toggle
            label="ពណ៌ស្រោមសំបុត្រតាមក្រដាសលិខិត"
            hint="បើក = ស្រោមសំបុត្រ ត្រាក្រមួន និងផ្ទៃខាងក្រោយ ប្រើពណ៌តាមក្រដាសដែលបានជ្រើស (ក្រដាស និងចលនា) ដើម្បីឱ្យស្រោម និងលិខិតត្រូវគ្នា។ បិទ = ប្រើម៉ូដខាងក្រោម។"
            checked={form.envelopeMatchPaper}
            onChange={(v) => set("envelopeMatchPaper", v)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ENVELOPE_STYLE_LIST.map((style) => {
            const active = form.envelopeStyle === style.key;
            return (
              <button
                key={style.key}
                type="button"
                onClick={() => set("envelopeStyle", style.key)}
                className={`rounded-xl border p-3 text-left transition ${
                  active ? "border-amber-500 ring-2 ring-amber-200" : "border-slate-200 hover:border-amber-300"
                }`}
                aria-pressed={active}
              >
                <span
                  className="mb-2 flex h-20 items-end justify-center rounded-lg p-2"
                  style={{
                    background: `linear-gradient(160deg, ${style.paper}, ${style.paperDeep})`,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)",
                  }}
                >
                  <span
                    className="h-8 w-full rounded"
                    style={{
                      background: `linear-gradient(104deg, ${style.goldDeep}, ${style.gold}, ${style.goldLight}, ${style.gold})`,
                      clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                      opacity: 0.85,
                    }}
                  />
                </span>
                <span className="block text-sm font-medium text-slate-800">{style.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{style.note}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="ពណ៌ក្រដាស" hint="ទទេ = ប្រើពណ៌របស់ម៉ូដ">
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-10 w-12 shrink-0 cursor-pointer rounded border border-slate-300"
                value={form.envelopePaper || preview.paper}
                onChange={(e) => set("envelopePaper", e.target.value)}
                aria-label="ពណ៌ក្រដាស"
              />
              <Input
                value={form.envelopePaper}
                onChange={(e) => set("envelopePaper", e.target.value)}
                placeholder={preview.paper}
                maxLength={9}
              />
              {form.envelopePaper && (
                <Button variant="ghost" type="button" onClick={() => set("envelopePaper", "")}>
                  ដកចេញ
                </Button>
              )}
            </div>
          </Field>

          <Field label="ពណ៌មាស" hint="ទទេ = ប្រើពណ៌របស់ម៉ូដ">
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-10 w-12 shrink-0 cursor-pointer rounded border border-slate-300"
                value={form.envelopeGold || preview.gold}
                onChange={(e) => set("envelopeGold", e.target.value)}
                aria-label="ពណ៌មាស"
              />
              <Input
                value={form.envelopeGold}
                onChange={(e) => set("envelopeGold", e.target.value)}
                placeholder={preview.gold}
                maxLength={9}
              />
              {form.envelopeGold && (
                <Button variant="ghost" type="button" onClick={() => set("envelopeGold", "")}>
                  ដកចេញ
                </Button>
              )}
            </div>
          </Field>
        </div>
      </Card>

      <Card
        title="រូបភាពផ្ទាល់ខ្លួនលើសំបុត្រ"
        description="បញ្ចូលរូបភាពរបស់អ្នក ដើម្បីបោះពុម្ពលើក្រដាសសំបុត្រ"
      >
        {/*
          * What this does and does not do, said plainly, because the couple
          * cannot see it from the field alone: the picture is *printed on the
          * paper*. The envelope still splits down the middle and still slides
          * apart, the seal still holds it shut, and the picture runs across
          * both halves as one drawing — it is not a replacement for the
          * envelope, it is what the envelope is made of.
          */}
        <ArtworkField
          label="រូបភាពលើសំបុត្រ"
          hint="រូបនឹងបោះពុម្ពពេញសំបុត្រ ហើយនៅតែបែកជាពីរផ្នែករអិលចេញដូចដើម។ ទំហំណែនាំ ១០០០ × ១២៨០ ភីកសែល (បញ្ឈរ)។"
          mediaId={form.envelopeFaceMediaId}
          onMedia={(id) => set("envelopeFaceMediaId", id)}
          fit={form.envelopeFaceFit}
          /* No "tile": this one is drawn as a single <image> inside the
             envelope's SVG, and SVG has no repeating paint. */
          fits={["cover", "contain", "stretch"]}
          onFit={(fit) => set("envelopeFaceFit", fit)}
          strength={form.envelopeFaceScrim}
          onStrength={(value) => set("envelopeFaceScrim", value)}
          strengthLabel={(value) => `កម្រិតពន្លឺក្រដាសលើរូប — ${value}%`}
          strengthHint="បង្កើនបើអក្សរមាស ឬក្បាច់មើលមិនច្បាស់លើរូប"
        >
          <Toggle
            label="រក្សាស៊ុមមាស និងក្បាច់ផុសលើរូប"
            hint="បិទ បើចង់ឃើញរូបភាពសុទ្ធ គ្មានក្បាច់ពីលើ"
            checked={form.envelopeFaceOrnament}
            onChange={(v) => set("envelopeFaceOrnament", v)}
          />
        </ArtworkField>
      </Card>

      <Card
        title="វាំងនន"
        description="វាំងននដែលបើកចេញ បង្ហាញសំបុត្រ បន្ទាប់ពីស្រោមសំបុត្រ។ អាចបិទ ឬបញ្ចូលក្រណាត់ផ្ទាល់ខ្លួន"
      >
        <div className="space-y-4">
          <Toggle
            label="បង្ហាញវាំងនន"
            hint="បិទ ដើម្បីបង្ហាញសំបុត្រភ្លាមៗ គ្មានវាំងននបើក"
            checked={form.curtainEnabled}
            onChange={(v) => set("curtainEnabled", v)}
          />
        </div>
        {form.curtainEnabled && (
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <p className="text-sm font-medium text-slate-700">រូបភាព ឬវីដេអូលើវាំងនន</p>
          <Field label="ប្រភេទ">
            <Select
              value={form.curtainMediaKind}
              onChange={(e) => {
                /* The two kinds are served by different elements, so switching
                   has to clear the file as well as the label — otherwise a
                   video id is handed to an <img> and the panel is blank. */
                set("curtainMediaKind", e.target.value);
                set("curtainMediaId", null);
              }}
            >
              <option value="image">រូបភាព</option>
              <option value="video">វីដេអូ (ចាក់វិលជុំ គ្មានសំឡេង)</option>
            </Select>
          </Field>

          <ArtworkField
            label={form.curtainMediaKind === "video" ? "វីដេអូវាំងនន" : "រូបភាពវាំងនន"}
            kind={form.curtainMediaKind === "video" ? "video" : "image"}
            hint={
              form.curtainMediaKind === "video"
                ? "វីដេអូចាក់វិលជុំ គ្មានសំឡេង។ លើទូរស័ព្ទដែលយឺត ប្រព័ន្ធនឹងបង្ហាញរូបគម្របជំនួស ដើម្បីកុំឱ្យទំព័រគាំង។"
                : "រូបនឹងគ្របពេញឆាក ហើយវាំងននទាំងសងខាងនៅតែរួញបើកឆ្វេង-ស្ដាំដូចដើម។"
            }
            mediaId={form.curtainMediaId}
            onMedia={(id) => set("curtainMediaId", id)}
            fit={form.curtainFit}
            onFit={(fit) => set("curtainFit", fit)}
            strength={form.curtainShade}
            onStrength={(value) => set("curtainShade", value)}
            strengthLabel={(value) => `កម្រិតស្រមោលផ្នត់ — ${value}%`}
            strengthHint="ស្រមោលផ្នត់ត្រូវបានលាយជាពន្លឺ មិនមែនគូរពីលើទេ ដូច្នេះពណ៌រូបរបស់អ្នកនៅដដែល"
          >
            <Toggle
              label="ដាក់ស្រមោលផ្នត់វាំងននលើរូប"
              hint="បិទ បើចង់ឃើញរូប ឬវីដេអូសុទ្ធ"
              checked={form.curtainFolds}
              onChange={(v) => set("curtainFolds", v)}
            />
            {form.curtainMediaKind === "video" && (
              <MediaUpload
                label="រូបគម្របវីដេអូ (បង្ហាញពេលកំពុងផ្ទុក ឬលើទូរស័ព្ទយឺត)"
                kind="image"
                currentSrc={form.curtainPosterId ? `/api/media/${form.curtainPosterId}` : undefined}
                onUploaded={(id) => set("curtainPosterId", id)}
                onClear={() => set("curtainPosterId", null)}
              />
            )}
          </ArtworkField>
        </div>
        )}
      </Card>

      <Card
        title="ក្បាច់លើគម្របស្រោមសំបុត្រ"
        description="អ្វីដែលបោះពុម្ពជាមាសលើគម្របស្រោមសំបុត្រ"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: "namelogo", title: "ឡូហ្គោឈ្មោះ", text: "ឈ្មោះកូនប្រុស និងកូនស្រី ដូចនៅលើកាត និងគម្របសំបុត្រ" },
            {
              value: "monogram",
              title: "អក្សរផ្ចិត (Monogram)",
              text: wedding.monogram?.trim()
                ? `អក្សរ «${wedding.monogram}» ពីព័ត៌មានអាពាហ៍ពិពាហ៍`
                : "មិនទាន់មានអក្សរផ្ចិតទេ — សូមបញ្ចូលនៅទំព័រព័ត៌មានអាពាហ៍ពិពាហ៍។ បើទទេ នឹងបង្ហាញឡូហ្គោឈ្មោះ",
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => set("envelopeFlapMark", option.value)}
              className={`rounded-xl border p-4 text-left transition ${
                form.envelopeFlapMark === option.value
                  ? "border-amber-500 bg-amber-50/60 ring-1 ring-amber-300"
                  : "border-slate-200 hover:border-amber-300"
              }`}
              aria-pressed={form.envelopeFlapMark === option.value}
            >
              <p className="text-sm font-medium text-slate-800">{option.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{option.text}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card title="ត្រាបិទសំបុត្រ">
        <div className="space-y-4">
          <Toggle
            label="បង្ហាញត្រា"
            checked={form.envelopeSeal}
            onChange={(v) => set("envelopeSeal", v)}
          />
          <Field
            label="អក្សរលើត្រា"
            hint={`ទទេ = អក្សរកាត់របស់គូស្វាមីភរិយា (${sealInitials(wedding.groomName, wedding.brideName)})`}
          >
            <Input
              value={form.envelopeSealText}
              onChange={(e) => set("envelopeSealText", e.target.value)}
              placeholder={sealInitials(wedding.groomName, wedding.brideName)}
              maxLength={24}
            />
          </Field>
        </div>
      </Card>

      <Card title="ចលនា និងអក្សរ">
        <div className="space-y-5">
          <Field
            label={`រយៈពេលចលនា — ${(form.envelopeDuration / 1000).toFixed(1)} វិនាទី`}
            hint="ចន្លោះ ១,៦ ដល់ ១៤ វិនាទី · ណែនាំ ៦ វិនាទី សម្រាប់ការបើកស្រោមសំបុត្រពេញលេញ"
          >
            <input
              type="range"
              min={1600}
              max={14000}
              step={100}
              value={form.envelopeDuration}
              onChange={(e) => set("envelopeDuration", Number(e.target.value))}
              className="w-full accent-amber-600"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ចំណងជើងលើស្រោមសំបុត្រ" hint="ទទេ = មិនបង្ហាញ">
              <Input
                value={form.envelopeTitle}
                onChange={(e) => set("envelopeTitle", e.target.value)}
                maxLength={80}
              />
            </Field>
            <Field label="អក្សរតុបតែងខាងក្រោម" hint="ឧ. The Wedding Invitation · ទទេ = មិនបង្ហាញ">
              <Input
                value={form.envelopeSubtitle}
                onChange={(e) => set("envelopeSubtitle", e.target.value)}
                maxLength={80}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="អក្សរលើប៊ូតុងបើក">
              <Input
                value={form.envelopeOpenLabel}
                onChange={(e) => set("envelopeOpenLabel", e.target.value)}
                maxLength={60}
              />
            </Field>
            <Field label="អក្សរណែនាំ">
              <Input
                value={form.envelopeHint}
                onChange={(e) => set("envelopeHint", e.target.value)}
                maxLength={120}
              />
            </Field>
            <Field label="អក្សរប៊ូតុងរំលង">
              <Input
                value={form.envelopeSkipLabel}
                onChange={(e) => set("envelopeSkipLabel", e.target.value)}
                maxLength={40}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card
        title="ស៊ុមក្បាច់ខ្មែរ"
        description="ក្បាច់មាសបោះពុម្ពផុសលើក្រដាស — ស្ថិត មិនមានចលនា"
      >
        <div className="space-y-4">
          <Toggle
            label="ក្បាច់ផុស (emboss)"
            hint="ស្រមោល និងគែមភ្លឺ ធ្វើឱ្យក្បាច់ផុសចេញពីក្រដាស"
            checked={form.frameEmboss}
            onChange={(v) => set("frameEmboss", v)}
          />

          <Field
            label={`កម្រិតផុស — ${form.frameDepth}%`}
            hint="ទាប = ស្ដើង, ខ្ពស់ = ផុសច្បាស់"
          >
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.frameDepth}
              onChange={(e) => set("frameDepth", Number(e.target.value))}
              className="w-full accent-amber-600"
            />
          </Field>

          <p className="text-xs leading-relaxed text-slate-500">
            ស៊ុមក្បាច់ខ្មែរគ្មានចលនាទេ។ ចលនាទាំងអស់ស្ថិតនៅលើសំបុត្រប៉ុណ្ណោះ។
            ដើម្បីកែទំហំស៊ុម សូមទៅកាន់ <strong>រូបរាង</strong>។
          </p>
        </div>
      </Card>

      <Card
        title="វីដេអូមុនអាពាហ៍ពិពាហ៍"
        description="ចាក់បន្ទាប់ពីបើកសំបុត្ររួច មុនពេលវាំងននបើក"
      >
        <div className="space-y-4">
          <Toggle
            label="បង្ហាញវីដេអូ"
            checked={form.videoEnabled}
            onChange={(v) => set("videoEnabled", v)}
          />

          {form.videoEnabled && (
            <>
              <Field
                label="តំណវីដេអូ (YouTube, Vimeo, Facebook ឬ .mp4)"
                hint="ចម្លងតំណពេញ រួមទាំង https://"
              >
                <Input
                  value={form.videoUrl}
                  placeholder="https://youtu.be/..."
                  onChange={(e) => set("videoUrl", e.target.value)}
                />
              </Field>

              <MediaUpload
                label="ឬផ្ទុកឯកសារវីដេអូ (អតិបរមា 64MB)"
                kind="video"
                currentSrc={form.videoMediaId ? `/api/media/${form.videoMediaId}` : undefined}
                onUploaded={(id) => set("videoMediaId", id)}
                onClear={() => set("videoMediaId", null)}
              />

              <MediaUpload
                label="រូបភាពគម្រប (បង្ហាញពេលកំពុងផ្ទុក)"
                kind="image"
                currentSrc={form.videoPosterId ? `/api/media/${form.videoPosterId}` : undefined}
                onUploaded={(id) => set("videoPosterId", id)}
                onClear={() => set("videoPosterId", null)}
              />

              {/*
                * One wording, not two.
                *
                * There used to be a second label here for a "carry on" button,
                * shown when the film could not report its own ending — an
                * embed, or a file the browser refused to autoplay. It is the
                * same button doing the same job, and asking a couple to write
                * two names for it meant the guest saw whichever one the
                * browser happened to produce.
                */}
              <Field label="អក្សរប៊ូតុងរំលង">
                <Input
                  value={form.videoSkipLabel}
                  onChange={(e) => set("videoSkipLabel", e.target.value)}
                />
              </Field>

              {/*
                * What will actually happen, in words, before it is saved.
                *
                * The two sources behave differently and there is no way for a
                * couple to know that from the fields alone: a file we serve can
                * be muted, autoplayed and can tell the page it has finished, so
                * the invitation carries on by itself; a YouTube or Vimeo embed
                * is a different origin and will not say when it ends without
                * that platform's own JavaScript in the page, so the guest taps
                * to carry on. Resolved through the same `videoSource` the guest
                * runs, so this cannot drift from the truth.
                */}
              <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                {(() => {
                  const source = videoSource({ ...wedding, ...form });
                  if (!source) {
                    return "មិនទាន់មានវីដេអូ។ សូមបញ្ចូលតំណ ឬផ្ទុកឯកសារ។";
                  }
                  if (source.kind === "file") {
                    return "ឯកសារវីដេអូ៖ ចាក់ដោយស្វ័យប្រវត្តិ (បិទសំឡេង) ហើយបន្តទៅវាំងននដោយខ្លួនឯងពេលចប់។ ភ្ញៀវអាចបើកសំឡេង ឬរំលងបាន។";
                  }
                  return "តំណ YouTube / Vimeo / Facebook៖ ចាក់ដោយស្វ័យប្រវត្តិ (បិទសំឡេង) ប៉ុន្តែវេទិកាខាងក្រៅមិនប្រាប់ថាចប់ទេ — ភ្ញៀវត្រូវចុចប៊ូតុងរំលង ដើម្បីទៅលិខិត។";
                })()}
              </p>

              {form.videoMediaId && form.videoUrl.trim() && (
                <p className="text-xs text-amber-700">
                  មានទាំងតំណ និងឯកសារ — ប្រព័ន្ធនឹងប្រើ<strong>ឯកសារដែលបានផ្ទុក</strong>។
                </p>
              )}
            </>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={busy}
          onClick={() =>
            send("/api/admin/wedding", {
              method: "PUT",
              body: JSON.stringify(form),
              successText: "រក្សាទុករួចរាល់",
            })
          }
        >
          រក្សាទុក
        </Button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-amber-700 underline-offset-4 hover:underline"
        >
          មើលសំបុត្រអញ្ជើញ ↗
        </a>
      </div>
    </div>
  );
}

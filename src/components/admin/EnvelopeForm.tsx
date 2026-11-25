"use client";

import { workspacePath } from "@/lib/workspacePath";
import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import {
  sealInitials,
  type EnvelopeStyleKey,
} from "@/lib/envelope";
import { ArtworkField, Button, Card, Field, Input, MediaUpload, Select, StatusMessage, Toggle, useApi } from "./ui";
import { videoSource } from "@/lib/video";

import { useT } from "./AdminPrefs";
/**
 * "3D Envelope" — the sealed card a guest opens before the invitation.
 *
 * Every control here is optional in the sense that turning the whole thing off
 * puts the invitation back exactly as it was, so a couple who does not want an
 * envelope loses nothing by saying so.
 */
export function EnvelopeForm({ wedding }: { wedding: Wedding }) {
  const t = useT();
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">3D Envelope &amp; Frame</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("សំបុត្រអញ្ជើញ ៣មិតិ")}</p>
      </header>

      <StatusMessage message={message} />

      <Card title={t("បើក / បិទ")}>
        <div className="space-y-3">
          <Toggle
            label={t("បង្ហាញសំបុត្រ ៣មិតិ")}
            hint={t("បិទ = ភ្ញៀវឃើញលិខិតអញ្ជើញដោយផ្ទាល់ ដូចមុន")}
            checked={form.envelopeEnabled}
            onChange={(v) => set("envelopeEnabled", v)}
          />
          <Toggle
            label={t("បើកចលនា ៣មិតិ")}
            hint={t("បិទ = បើករួច ផ្លាស់ប្ដូរដោយរលោងភ្លាមៗ (ដូចរបៀបកាត់បន្ថយចលនា)")}
            checked={form.envelopeAnimate}
            onChange={(v) => set("envelopeAnimate", v)}
          />
          <Toggle
            label={t("បង្ហាញសំបុត្រគ្រប់ពេលចូលមើល")}
            hint={t("បិទ = បើករួចហើយ មិនបង្ហាញម្ដងទៀតក្នុងការចូលមើលដដែល")}
            checked={form.envelopeEveryVisit}
            onChange={(v) => set("envelopeEveryVisit", v)}
          />
          <Toggle
            label={t("បង្ហាញប៊ូតុងរំលង")}
            checked={form.envelopeSkip}
            onChange={(v) => set("envelopeSkip", v)}
          />
          <Toggle
            label={t("ចាក់ភ្លេងបន្ទាប់ពីបើកសំបុត្រ")}
            hint={t("ភ្លេងមិនចាក់មុនភ្ញៀវចុចឡើយ")}
            checked={form.envelopeMusic}
            onChange={(v) => set("envelopeMusic", v)}
          />
        </div>
      </Card>

      {/*
        * The envelope's own style and colours, and a picture printed on it,
        * are no longer offered here: the envelope takes its colours from the
        * letter's paper, and Themes 2 and 3 replace it with a picture. The
        * saved values are left as they are, so nothing changes for an
        * invitation that already uses them.
        */}
      <Card
        title={t("វាំងនន")}
        description={t("វាំងននដែលបើកចេញ បង្ហាញសំបុត្រ បន្ទាប់ពីស្រោមសំបុត្រ។ អាចបិទ ឬបញ្ចូលក្រណាត់ផ្ទាល់ខ្លួន")}
      >
        <div className="space-y-4">
          <Toggle
            label={t("បង្ហាញវាំងនន")}
            hint={t("បិទ ដើម្បីបង្ហាញសំបុត្រភ្លាមៗ គ្មានវាំងននបើក")}
            checked={form.curtainEnabled}
            onChange={(v) => set("curtainEnabled", v)}
          />
        </div>
        {form.curtainEnabled && (
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <p className="text-sm font-medium text-slate-700">{t("រូបភាព ឬវីដេអូលើវាំងនន")}</p>
          <Field label={t("ប្រភេទ")}>
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
              <option value="image">{t("រូបភាព")}</option>
              <option value="video">{t("វីដេអូ (ចាក់វិលជុំ គ្មានសំឡេង)")}</option>
            </Select>
          </Field>

          <ArtworkField
            label={form.curtainMediaKind === "video" ? t("វីដេអូវាំងនន") : t("រូបភាពវាំងនន")}
            kind={form.curtainMediaKind === "video" ? "video" : "image"}
            hint={
              form.curtainMediaKind === "video"
                ? t("វីដេអូចាក់វិលជុំ គ្មានសំឡេង។ លើទូរស័ព្ទដែលយឺត ប្រព័ន្ធនឹងបង្ហាញរូបគម្របជំនួស ដើម្បីកុំឱ្យទំព័រគាំង។")
                : t("រូបនឹងគ្របពេញឆាក ហើយវាំងននទាំងសងខាងនៅតែរួញបើកឆ្វេង-ស្ដាំដូចដើម។")
            }
            mediaId={form.curtainMediaId}
            onMedia={(id) => set("curtainMediaId", id)}
            fit={form.curtainFit}
            onFit={(fit) => set("curtainFit", fit)}
            strength={form.curtainShade}
            onStrength={(value) => set("curtainShade", value)}
            strengthLabel={(value) => `${t("កម្រិតស្រមោលផ្នត់")} — ${value}%`}
            strengthHint={t("ស្រមោលផ្នត់ត្រូវបានលាយជាពន្លឺ មិនមែនគូរពីលើទេ ដូច្នេះពណ៌រូបរបស់អ្នកនៅដដែល")}
          >
            <Toggle
              label={t("ដាក់ស្រមោលផ្នត់វាំងននលើរូប")}
              hint={t("បិទ បើចង់ឃើញរូប ឬវីដេអូសុទ្ធ")}
              checked={form.curtainFolds}
              onChange={(v) => set("curtainFolds", v)}
            />
            {form.curtainMediaKind === "video" && (
              <MediaUpload
                label={t("រូបគម្របវីដេអូ (បង្ហាញពេលកំពុងផ្ទុក ឬលើទូរស័ព្ទយឺត)")}
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
        title={t("ក្បាច់លើគម្របស្រោមសំបុត្រ")}
        description={t("អ្វីដែលបោះពុម្ពជាមាសលើគម្របស្រោមសំបុត្រ")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: "namelogo", title: "ឡូហ្គោឈ្មោះ", text: t("ឈ្មោះកូនប្រុស និងកូនស្រី ដូចនៅលើកាត និងគម្របសំបុត្រ") },
            {
              value: "monogram",
              title: "អក្សរផ្ចិត (Monogram)",
              text: wedding.monogram?.trim()
                ? `${t("អក្សរ")} «${wedding.monogram}» ${t("ពីព័ត៌មានអាពាហ៍ពិពាហ៍")}`
                : t("មិនទាន់មានអក្សរផ្ចិតទេ — សូមបញ្ចូលនៅទំព័រព័ត៌មានអាពាហ៍ពិពាហ៍។ បើទទេ នឹងបង្ហាញឡូហ្គោឈ្មោះ"),
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
              <p className="text-sm font-medium text-slate-800">{t(option.title)}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{option.text}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card title={t("ត្រាបិទសំបុត្រ")}>
        <div className="space-y-4">
          <Toggle
            label={t("បង្ហាញត្រា")}
            checked={form.envelopeSeal}
            onChange={(v) => set("envelopeSeal", v)}
          />
          <Field
            label={t("អក្សរលើត្រា")}
            hint={`${t("ទទេ = អក្សរកាត់របស់គូស្វាមីភរិយា")} (${sealInitials(wedding.groomName, wedding.brideName)})`}
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

      <Card title={t("ចលនា និងអក្សរ")}>
        <div className="space-y-5">
          <Field
            label={`${t("រយៈពេលចលនា")} — ${(form.envelopeDuration / 1000).toFixed(1)} ${t("វិនាទី")}`}
            hint={t("ចន្លោះ ១,៦ ដល់ ១៤ វិនាទី · ណែនាំ ៦ វិនាទី សម្រាប់ការបើកស្រោមសំបុត្រពេញលេញ")}
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
            <Field label={t("ចំណងជើងលើស្រោមសំបុត្រ")} hint={t("ទទេ = មិនបង្ហាញ")}>
              <Input
                value={form.envelopeTitle}
                onChange={(e) => set("envelopeTitle", e.target.value)}
                maxLength={80}
              />
            </Field>
            <Field label={t("អក្សរតុបតែងខាងក្រោម")} hint={t("ឧ. The Wedding Invitation · ទទេ = មិនបង្ហាញ")}>
              <Input
                value={form.envelopeSubtitle}
                onChange={(e) => set("envelopeSubtitle", e.target.value)}
                maxLength={80}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("អក្សរលើប៊ូតុងបើក")}>
              <Input
                value={form.envelopeOpenLabel}
                onChange={(e) => set("envelopeOpenLabel", e.target.value)}
                maxLength={60}
              />
            </Field>
            <Field label={t("អក្សរណែនាំ")}>
              <Input
                value={form.envelopeHint}
                onChange={(e) => set("envelopeHint", e.target.value)}
                maxLength={120}
              />
            </Field>
            <Field label={t("អក្សរប៊ូតុងរំលង")}>
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
        title={t("វីដេអូមុនអាពាហ៍ពិពាហ៍")}
        description={t("ចាក់បន្ទាប់ពីបើកសំបុត្ររួច មុនពេលវាំងននបើក")}
      >
        <div className="space-y-4">
          <Toggle
            label={t("បង្ហាញវីដេអូ")}
            checked={form.videoEnabled}
            onChange={(v) => set("videoEnabled", v)}
          />

          {form.videoEnabled && (
            <>
              <Field
                label={t("តំណវីដេអូ (YouTube, Vimeo, Facebook ឬ .mp4)")}
                hint={t("ចម្លងតំណពេញ រួមទាំង https://")}
              >
                <Input
                  value={form.videoUrl}
                  placeholder="https://youtu.be/..."
                  onChange={(e) => set("videoUrl", e.target.value)}
                />
              </Field>

              <MediaUpload
                label={t("ឬផ្ទុកឯកសារវីដេអូ (អតិបរមា 64MB)")}
                kind="video"
                currentSrc={form.videoMediaId ? `/api/media/${form.videoMediaId}` : undefined}
                onUploaded={(id) => set("videoMediaId", id)}
                onClear={() => set("videoMediaId", null)}
              />

              <MediaUpload
                label={t("រូបភាពគម្រប (បង្ហាញពេលកំពុងផ្ទុក)")}
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
              <Field label={t("អក្សរប៊ូតុងរំលង")}>
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
                    return t("មិនទាន់មានវីដេអូ។ សូមបញ្ចូលតំណ ឬផ្ទុកឯកសារ។");
                  }
                  if (source.kind === "file") {
                    return t("ឯកសារវីដេអូ៖ ចាក់ដោយស្វ័យប្រវត្តិ (បិទសំឡេង) ហើយបន្តទៅវាំងននដោយខ្លួនឯងពេលចប់។ ភ្ញៀវអាចបើកសំឡេង ឬរំលងបាន។");
                  }
                  return t("តំណ YouTube / Vimeo / Facebook៖ ចាក់ដោយស្វ័យប្រវត្តិ (បិទសំឡេង) ប៉ុន្តែវេទិកាខាងក្រៅមិនប្រាប់ថាចប់ទេ — ភ្ញៀវត្រូវចុចប៊ូតុងរំលង ដើម្បីទៅលិខិត។");
                })()}
              </p>

              {form.videoMediaId && form.videoUrl.trim() && (
                <p className="text-xs text-amber-700">
                  {t("មានទាំងតំណ និងឯកសារ — ប្រព័ន្ធនឹងប្រើ")}<strong>{t("ឯកសារដែលបានផ្ទុក")}</strong>{t("។")}</p>
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
              successText: t("រក្សាទុករួចរាល់"),
            })
          }
        >
          {t("រក្សាទុក")}</Button>
        <a
          href={workspacePath(wedding.slug)}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-amber-700 underline-offset-4 hover:underline"
        >
          {t("មើលសំបុត្រអញ្ជើញ ↗")}</a>
      </div>
    </div>
  );
}

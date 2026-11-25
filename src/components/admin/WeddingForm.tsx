"use client";

import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { MonogramFontPicker } from "./MonogramFontPicker";
import { Button, Card, Field, Input, MediaUpload, Select, StatusMessage, Textarea, Toggle, useApi } from "./ui";

import { useT } from "./AdminPrefs";
/** Master form for every piece of wedding content shown on the invitation. */
export function WeddingForm({ wedding }: { wedding: Wedding }) {
  const t = useT();
  const [form, setForm] = useState({
    ...wedding,
    weddingDate: toLocalInput(wedding.weddingDate),
  });
  const { busy, message, send } = useApi();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const { id, updatedAt, ...payload } = form;
    void id;
    void updatedAt;
    await send("/api/admin/wedding", {
      method: "PUT",
      body: JSON.stringify({
        ...payload,
        weddingDate: new Date(form.weddingDate as unknown as string).toISOString(),
      }),
      successText: t("ព័ត៌មានអាពាហ៍ពិពាហ៍ត្រូវបានរក្សាទុក"),
    });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{t("ព័ត៌មានអាពាហ៍ពិពាហ៍")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("អត្ថបទទាំងអស់នេះនឹងបង្ហាញនៅលើសំបុត្រអញ្ជើញ")}</p>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? t("កំពុងរក្សាទុក...") : t("រក្សាទុក")}
        </Button>
      </div>

      <StatusMessage message={message} />

      <Card title={t("ទំព័រគម្រប")} description={t("អ្វីដែលភ្ញៀវឃើញមុនពេលបើកសំបុត្រ")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("ចំណងជើងធំ")}>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label={t("អត្ថបទខាងលើ")} hint={t("នៅលើគម្រប និងស្រោមសំបុត្រ ឧ. សូមគោរពអញ្ជើញ")}>
            <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field label={t("អក្សរលើប៊ូតុងបើកសំបុត្រ")}>
            <Input value={form.openButton} onChange={(e) => set("openButton", e.target.value)} />
          </Field>
          <Field label={t("អក្សរផ្ចិត (Monogram)")} hint={t("ឧ. S&L ឬ ស ក — បង្ហាញនៅលើគម្របសំបុត្រ")}>
            <Input value={form.monogram} maxLength={12} onChange={(e) => set("monogram", e.target.value)} />
          </Field>
          <Field label={t("រូបភាពគម្រប (URL)")} hint={t("បង្ហាញតែជារូបភាពនៃតំណអញ្ជើញ ពេលចែករំលែក (មិនបង្ហាញនៅក្នុងសំបុត្រ) — ឬផ្ទុករូបភាពខាងក្រោម")}>
            <Input value={form.coverPhotoUrl} onChange={(e) => set("coverPhotoUrl", e.target.value)} />
          </Field>
        </div>
        <div className="mt-5">
          <Field
            label={t("ពុម្ពអក្សរផ្ចិត (Monogram font)")}
            hint={t("ចុចជ្រើសរើស — រូបភាពខាងក្រោមគឺជាអក្សរផ្ចិតរបស់អ្នកពិតប្រាកដ")}
          >
            <MonogramFontPicker
              value={form.monogramFont}
              monogram={form.monogram}
              groom={form.groomName}
              bride={form.brideName}
              onChange={(id) => set("monogramFont", id)}
            />
          </Field>
        </div>

        {/* the name logo between the names: on or off, and the couple's own image */}
        <div className="mt-4">
          <Toggle
            label={t("បង្ហាញឡូហ្គោឈ្មោះ · Show name logo")}
            hint={t("ឡូហ្គោនៅចន្លោះឈ្មោះកូនប្រុស និងកូនស្រី (រូបភាពដែលបានផ្ទុក ឬអក្សរផ្ចិតលំនាំដើម)")}
            checked={form.nameLogoEnabled}
            onChange={(v) => set("nameLogoEnabled", v)}
          />
        </div>
        <div className={`mt-4 grid gap-4 sm:grid-cols-2 ${form.nameLogoEnabled ? "" : "opacity-50"}`}>
          <MediaUpload
            label={t("រូបភាពឡូហ្គោឈ្មោះ (ស្រេចចិត្ត) · Name logo image")}
            currentSrc={mediaSrc(form.nameLogoMediaId, "")}
            onUploaded={(id) => set("nameLogoMediaId", id)}
            onClear={() => set("nameLogoMediaId", null)}
          />
          <Field
            label={t("របៀបបង្ហាញឡូហ្គោ")}
            hint={t("មាស៖ ផ្នែកពណ៌ភ្លឺនៃរូបភាព បោះពុម្ពជាពណ៌មាស លើក្រដាសគ្រប់ពណ៌ (ផ្ទៃខាងក្រោយត្រូវបានដកចេញ)។ ដើម៖ បង្ហាញរូបភាពដូចដែលបានផ្ទុក។")}
          >
            <Select value={form.nameLogoMode} onChange={(e) => set("nameLogoMode", e.target.value)}>
              <option value="foil">{t("មាស · Foil (light parts in gold)")}</option>
              <option value="original">{t("ដើម · Original image")}</option>
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <MediaUpload
            label={t("ផ្ទុករូបភាពគម្រប")}
            currentSrc={mediaSrc(form.coverPhotoId, form.coverPhotoUrl)}
            onUploaded={(id) => set("coverPhotoId", id)}
            onClear={() => { set("coverPhotoId", null); set("coverPhotoUrl", ""); }}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("កូនប្រុស")}>
          <div className="space-y-4">
            <Field label={t("ងារ")}><Input value={form.groomTitle} onChange={(e) => set("groomTitle", e.target.value)} /></Field>
            <Field label={t("ឈ្មោះខ្លី")} hint={t("បង្ហាញនៅលើគម្រប និងចំណងជើង")}>
              <Input value={form.groomName} onChange={(e) => set("groomName", e.target.value)} />
            </Field>
            <Field label={t("ឈ្មោះពេញ")}><Input value={form.groomFullName} onChange={(e) => set("groomFullName", e.target.value)} /></Field>
            <Field label={t("ឈ្មោះឪពុក")}><Input value={form.groomFatherName} onChange={(e) => set("groomFatherName", e.target.value)} /></Field>
            <Field label={t("ឈ្មោះម្ដាយ")}><Input value={form.groomMotherName} onChange={(e) => set("groomMotherName", e.target.value)} /></Field>
            <Field label={t("លេខទូរស័ព្ទ")}><Input value={form.groomPhone} onChange={(e) => set("groomPhone", e.target.value)} /></Field>
            <MediaUpload
              label={t("រូបថត")}
              currentSrc={mediaSrc(form.groomPhotoId, form.groomPhotoUrl)}
              onUploaded={(id) => set("groomPhotoId", id)}
              onClear={() => { set("groomPhotoId", null); set("groomPhotoUrl", ""); }}
            />
          </div>
        </Card>

        <Card title={t("កូនស្រី")}>
          <div className="space-y-4">
            <Field label={t("ងារ")}><Input value={form.brideTitle} onChange={(e) => set("brideTitle", e.target.value)} /></Field>
            <Field label={t("ឈ្មោះខ្លី")}><Input value={form.brideName} onChange={(e) => set("brideName", e.target.value)} /></Field>
            <Field label={t("ឈ្មោះពេញ")}><Input value={form.brideFullName} onChange={(e) => set("brideFullName", e.target.value)} /></Field>
            <Field label={t("ឈ្មោះឪពុក")}><Input value={form.brideFatherName} onChange={(e) => set("brideFatherName", e.target.value)} /></Field>
            <Field label={t("ឈ្មោះម្ដាយ")}><Input value={form.brideMotherName} onChange={(e) => set("brideMotherName", e.target.value)} /></Field>
            <Field label={t("លេខទូរស័ព្ទ")}><Input value={form.bridePhone} onChange={(e) => set("bridePhone", e.target.value)} /></Field>
            <MediaUpload
              label={t("រូបថត")}
              currentSrc={mediaSrc(form.bridePhotoId, form.bridePhotoUrl)}
              onUploaded={(id) => set("bridePhotoId", id)}
              onClear={() => { set("bridePhotoId", null); set("bridePhotoUrl", ""); }}
            />
          </div>
        </Card>
      </div>

      <Card title={t("អត្ថបទអញ្ជើញផ្លូវការ")}>
        <div className="space-y-4">
          <Field
            label={t("ឃ្លាបើកលិខិត")}
            hint={t("បង្ហាញនៅក្នុងលិខិតអញ្ជើញ ខាងលើងារកិត្តិយស — ដាច់ដោយឡែកពី «អត្ថបទខាងលើ» នៅលើគម្រប និងស្រោមសំបុត្រ")}
          >
            <Input value={form.invitationLead} onChange={(e) => set("invitationLead", e.target.value)} maxLength={160} />
          </Field>
          <Toggle
            label={t("បង្ហាញ «ជាគូនឹង» ជំនួសស្លាកសញ្ញា")}
            hint={t("រវាងឈ្មោះកូនប្រុស និងកូនស្រី ក្នុងលិខិត៖ បើក = ជាគូនឹង · បិទ = ស្លាកសញ្ញាខ្មែរ · Show ជាគូនឹង instead of the monogram")}
            checked={form.letterJoinText}
            onChange={(v) => set("letterJoinText", v)}
          />
          <Field
            label={t("ថ្ងៃខែ និងទីតាំង — ឃ្លាចាប់ផ្ដើម")}
            hint={t("ឧ. ដែលនឹងប្រព្រឹត្តទៅនៅ — ទុកទទេ ដើម្បីប្រើ «ដែលនឹងប្រព្រឹត្តទៅ» និងម៉ោង")}
          >
            <Input value={form.invitationWhenIntro} onChange={(e) => set("invitationWhenIntro", e.target.value)} maxLength={160} />
          </Field>
          <Field label={t("ថ្ងៃខែ និងទីតាំង — ថ្ងៃខែតាមចន្ទគតិ")} hint={t("ឧ. ថ្ងៃសៅរ៍ ១០កើត ខែមិគសិរ … ត្រូវនឹង — ទុកទទេ ដើម្បីលាក់")}>
            <Textarea rows={2} value={form.invitationLunarDate} onChange={(e) => set("invitationLunarDate", e.target.value)} maxLength={300} />
          </Field>
          <Field label={t("ថ្ងៃខែ និងទីតាំង — ថ្ងៃខែ និងម៉ោង (អក្សរធំ)")} hint={t("ទុកទទេ ដើម្បីប្រើ «ថ្ងៃខែជាភាសាខ្មែរ»")}>
            <Input value={form.invitationDateLine} onChange={(e) => set("invitationDateLine", e.target.value)} maxLength={200} />
          </Field>
          <Field label={t("ថ្ងៃខែ និងទីតាំង — ទីតាំង")} hint={t("ទុកទទេ ដើម្បីប្រើឈ្មោះ និងអាសយដ្ឋានទីកន្លែង")}>
            <Textarea rows={2} value={form.invitationPlace} onChange={(e) => set("invitationPlace", e.target.value)} maxLength={400} />
          </Field>
          <Field
            label={t("ងារកិត្តិយស")}
            hint={t("បង្ហាញជានិច្ចនៅលើសំបុត្រ — ភ្ញៀវត្រូវបានស្វាគមន៍តាមឈ្មោះនៅលើគម្របវិញ")}
          >
            <Textarea
              rows={2}
              value={form.invitationHonorific}
              onChange={(e) => set("invitationHonorific", e.target.value)}
            />
          </Field>
          <Field
            label={t("ឈ្មោះភ្ញៀវលំនាំដើម")}
            hint={t("បង្ហាញលើទំព័របើក និងគម្រប នៅពេលតំណមិនមានឈ្មោះភ្ញៀវ")}
          >
            <Input
              value={form.defaultGuestName}
              onChange={(e) => set("defaultGuestName", e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label={t("អត្ថបទអញ្ជើញ")}>
            <Textarea rows={3} value={form.invitationBody} onChange={(e) => set("invitationBody", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={t("ថ្ងៃខែ និងទីតាំង")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("ថ្ងៃខែ និងម៉ោង (សម្រាប់រាប់ថយក្រោយ)")}>
            <Input
              type="datetime-local"
              value={form.weddingDate as unknown as string}
              onChange={(e) => set("weddingDate", e.target.value as never)}
            />
          </Field>
          <Field label={t("ថ្ងៃខែជាភាសាខ្មែរ")} hint={t("ឧ. ថ្ងៃសៅរ៍ ទី ២៥ ខែ មេសា ឆ្នាំ ២០២៧")}>
            <Input value={form.weddingDateKhmer} onChange={(e) => set("weddingDateKhmer", e.target.value)} />
          </Field>
          <Field label={t("ម៉ោងជាភាសាខ្មែរ")}><Input value={form.weddingTimeKhmer} onChange={(e) => set("weddingTimeKhmer", e.target.value)} /></Field>
          <Field label={t("ព.ស.")}><Input value={form.buddhistYear} onChange={(e) => set("buddhistYear", e.target.value)} /></Field>
          <Field label={t("ឈ្មោះទីតាំង")}><Input value={form.venueName} onChange={(e) => set("venueName", e.target.value)} /></Field>
          <Field label={t("អាសយដ្ឋាន")}><Input value={form.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} /></Field>
          <Field label={t("តំណ Google Maps")} hint={t("ប៊ូតុង «បើក Google Maps»")}>
            <Input value={form.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} />
          </Field>
          <Field label={t("តំណ Google Maps Embed")} hint={t("ឧ. https://www.google.com/maps?q=...&output=embed")}>
            <Input value={form.mapEmbedUrl} onChange={(e) => set("mapEmbedUrl", e.target.value)} />
          </Field>
          <MediaUpload
            label={t("រូបភាពផែនទី (ស្រេចចិត្ត) · Map picture")}
            currentSrc={mediaSrc(form.venueMapMediaId, "")}
            onUploaded={(id) => set("venueMapMediaId", id)}
            onClear={() => set("venueMapMediaId", null)}
          />
          <p className="text-xs text-slate-500">
            {t("រូបផែនទីផ្ទាល់ខ្លួន (ឧ. ផែនទីគូរ ឬរូបថតអេក្រង់) បង្ហាញក្នុងផ្នែកទីតាំង។ ភ្ញៀវអាចចុចដើម្បីពង្រីក។")}</p>
        </div>
      </Card>

      <Card title={t("សេចក្ដីថ្លែងអំណរគុណ និងលិខិតសូមអភ័យទោស")} description={t("បង្ហាញនៅចុងបញ្ចប់នៃសំបុត្រ · ទុកទទេ ដើម្បីលាក់")}>
        <div className="space-y-4">
          <Field label={t("សេចក្ដីថ្លែងអំណរគុណ")}><Textarea rows={5} value={form.thanksLetter} onChange={(e) => set("thanksLetter", e.target.value)} /></Field>
          <Field label={t("លិខិតសូមអភ័យទោស")}><Textarea rows={5} value={form.apologyLetter} onChange={(e) => set("apologyLetter", e.target.value)} /></Field>
        </div>
      </Card>

      <Card title={t("ផ្នែកដែលបង្ហាញ")} description={t("បិទ/បើកផ្នែកនីមួយៗនៃសំបុត្រអញ្ជើញ")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label={t("រាប់ថយក្រោយ")} checked={form.showCountdown} onChange={(v) => set("showCountdown", v)} />
          <Toggle label={t("កម្មវិធីពិធី")} checked={form.showProgram} onChange={(v) => set("showProgram", v)} />
          <Toggle label={t("រឿងរ៉ាវស្នេហា")} checked={form.showLoveStory} onChange={(v) => set("showLoveStory", v)} />
          <Toggle label={t("វិចិត្រសាលរូបភាព")} checked={form.showGallery} onChange={(v) => set("showGallery", v)} />
          <Toggle label={t("បញ្ជាក់វត្តមាន (RSVP)")} checked={form.showRsvp} onChange={(v) => set("showRsvp", v)} />
          <Toggle label={t("ទំនាក់ទំនង")} checked={form.showContact} onChange={(v) => set("showContact", v)} />
          <Toggle label={t("ចែករំលែក")} checked={form.showShare} onChange={(v) => set("showShare", v)} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? t("កំពុងរក្សាទុក...") : t("រក្សាទុក")}
        </Button>
      </div>
    </form>
  );
}

/** Date → value accepted by <input type="datetime-local"> in local time. */
function toLocalInput(value: Date | string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

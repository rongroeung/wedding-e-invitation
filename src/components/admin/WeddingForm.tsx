"use client";

import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { Button, Card, Field, Input, MediaUpload, StatusMessage, Textarea, Toggle, useApi } from "./ui";

/** Master form for every piece of wedding content shown on the invitation. */
export function WeddingForm({ wedding }: { wedding: Wedding }) {
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
      successText: "ព័ត៌មានអាពាហ៍ពិពាហ៍ត្រូវបានរក្សាទុក",
    });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">ព័ត៌មានអាពាហ៍ពិពាហ៍</h1>
          <p className="mt-1 text-sm text-slate-500">អត្ថបទទាំងអស់នេះនឹងបង្ហាញនៅលើសំបុត្រអញ្ជើញ</p>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
        </Button>
      </div>

      <StatusMessage message={message} />

      <Card title="ទំព័រគម្រប" description="អ្វីដែលភ្ញៀវឃើញមុនពេលបើកសំបុត្រ">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ចំណងជើងធំ">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="អត្ថបទខាងលើ">
            <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field label="អក្សរលើប៊ូតុងបើកសំបុត្រ">
            <Input value={form.openButton} onChange={(e) => set("openButton", e.target.value)} />
          </Field>
          <Field label="អក្សរផ្ចិត (Monogram)" hint="ឧ. S&L — បង្ហាញនៅលើគម្របសំបុត្រ">
            <Input value={form.monogram} maxLength={12} onChange={(e) => set("monogram", e.target.value)} />
          </Field>
          <Field label="រូបភាពគម្រប (URL)" hint="ឬផ្ទុករូបភាពខាងក្រោម">
            <Input value={form.coverPhotoUrl} onChange={(e) => set("coverPhotoUrl", e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <MediaUpload
            label="ផ្ទុករូបភាពគម្រប"
            currentSrc={mediaSrc(form.coverPhotoId, form.coverPhotoUrl)}
            onUploaded={(id) => set("coverPhotoId", id)}
            onClear={() => { set("coverPhotoId", null); set("coverPhotoUrl", ""); }}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="កូនប្រុស">
          <div className="space-y-4">
            <Field label="ងារ"><Input value={form.groomTitle} onChange={(e) => set("groomTitle", e.target.value)} /></Field>
            <Field label="ឈ្មោះខ្លី" hint="បង្ហាញនៅលើគម្រប និងចំណងជើង">
              <Input value={form.groomName} onChange={(e) => set("groomName", e.target.value)} />
            </Field>
            <Field label="ឈ្មោះពេញ"><Input value={form.groomFullName} onChange={(e) => set("groomFullName", e.target.value)} /></Field>
            <Field label="ឈ្មោះឪពុក"><Input value={form.groomFatherName} onChange={(e) => set("groomFatherName", e.target.value)} /></Field>
            <Field label="ឈ្មោះម្ដាយ"><Input value={form.groomMotherName} onChange={(e) => set("groomMotherName", e.target.value)} /></Field>
            <Field label="លេខទូរស័ព្ទ"><Input value={form.groomPhone} onChange={(e) => set("groomPhone", e.target.value)} /></Field>
            <MediaUpload
              label="រូបថត"
              currentSrc={mediaSrc(form.groomPhotoId, form.groomPhotoUrl)}
              onUploaded={(id) => set("groomPhotoId", id)}
              onClear={() => { set("groomPhotoId", null); set("groomPhotoUrl", ""); }}
            />
          </div>
        </Card>

        <Card title="កូនស្រី">
          <div className="space-y-4">
            <Field label="ងារ"><Input value={form.brideTitle} onChange={(e) => set("brideTitle", e.target.value)} /></Field>
            <Field label="ឈ្មោះខ្លី"><Input value={form.brideName} onChange={(e) => set("brideName", e.target.value)} /></Field>
            <Field label="ឈ្មោះពេញ"><Input value={form.brideFullName} onChange={(e) => set("brideFullName", e.target.value)} /></Field>
            <Field label="ឈ្មោះឪពុក"><Input value={form.brideFatherName} onChange={(e) => set("brideFatherName", e.target.value)} /></Field>
            <Field label="ឈ្មោះម្ដាយ"><Input value={form.brideMotherName} onChange={(e) => set("brideMotherName", e.target.value)} /></Field>
            <Field label="លេខទូរស័ព្ទ"><Input value={form.bridePhone} onChange={(e) => set("bridePhone", e.target.value)} /></Field>
            <MediaUpload
              label="រូបថត"
              currentSrc={mediaSrc(form.bridePhotoId, form.bridePhotoUrl)}
              onUploaded={(id) => set("bridePhotoId", id)}
              onClear={() => { set("bridePhotoId", null); set("bridePhotoUrl", ""); }}
            />
          </div>
        </Card>
      </div>

      <Card title="អត្ថបទអញ្ជើញផ្លូវការ">
        <div className="space-y-4">
          <Field
            label="ងារកិត្តិយស"
            hint="បង្ហាញជានិច្ចនៅលើសំបុត្រ — ភ្ញៀវត្រូវបានស្វាគមន៍តាមឈ្មោះនៅលើគម្របវិញ"
          >
            <Textarea
              rows={2}
              value={form.invitationHonorific}
              onChange={(e) => set("invitationHonorific", e.target.value)}
            />
          </Field>
          <Field label="អត្ថបទអញ្ជើញ">
            <Textarea rows={3} value={form.invitationBody} onChange={(e) => set("invitationBody", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="ថ្ងៃខែ និងទីតាំង">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ថ្ងៃខែ និងម៉ោង (សម្រាប់រាប់ថយក្រោយ)">
            <Input
              type="datetime-local"
              value={form.weddingDate as unknown as string}
              onChange={(e) => set("weddingDate", e.target.value as never)}
            />
          </Field>
          <Field label="ថ្ងៃខែជាភាសាខ្មែរ" hint="ឧ. ថ្ងៃសៅរ៍ ទី ២៥ ខែ មេសា ឆ្នាំ ២០២៧">
            <Input value={form.weddingDateKhmer} onChange={(e) => set("weddingDateKhmer", e.target.value)} />
          </Field>
          <Field label="ម៉ោងជាភាសាខ្មែរ"><Input value={form.weddingTimeKhmer} onChange={(e) => set("weddingTimeKhmer", e.target.value)} /></Field>
          <Field label="ព.ស."><Input value={form.buddhistYear} onChange={(e) => set("buddhistYear", e.target.value)} /></Field>
          <Field label="ឈ្មោះទីតាំង"><Input value={form.venueName} onChange={(e) => set("venueName", e.target.value)} /></Field>
          <Field label="អាសយដ្ឋាន"><Input value={form.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} /></Field>
          <Field label="តំណ Google Maps" hint="ប៊ូតុង «បើក Google Maps»">
            <Input value={form.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} />
          </Field>
          <Field label="តំណ Google Maps Embed" hint="ឧ. https://www.google.com/maps?q=...&output=embed">
            <Input value={form.mapEmbedUrl} onChange={(e) => set("mapEmbedUrl", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="ពរជ័យបញ្ចប់ និង SEO">
        <div className="space-y-4">
          <Field label="អត្ថបទអរគុណ"><Textarea rows={2} value={form.blessingThanks} onChange={(e) => set("blessingThanks", e.target.value)} /></Field>
          <Field label="អត្ថបទជូនពរ"><Textarea rows={3} value={form.blessingWish} onChange={(e) => set("blessingWish", e.target.value)} /></Field>
          <Field label="Meta description" hint="បង្ហាញនៅពេលចែករំលែកលើ Telegram / Facebook">
            <Textarea rows={2} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="ផ្នែកដែលបង្ហាញ" description="បិទ/បើកផ្នែកនីមួយៗនៃសំបុត្រអញ្ជើញ">
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="រាប់ថយក្រោយ" checked={form.showCountdown} onChange={(v) => set("showCountdown", v)} />
          <Toggle label="កម្មវិធីពិធី" checked={form.showProgram} onChange={(v) => set("showProgram", v)} />
          <Toggle label="រឿងរ៉ាវស្នេហា" checked={form.showLoveStory} onChange={(v) => set("showLoveStory", v)} />
          <Toggle label="វិចិត្រសាលរូបភាព" checked={form.showGallery} onChange={(v) => set("showGallery", v)} />
          <Toggle label="បញ្ជាក់វត្តមាន (RSVP)" checked={form.showRsvp} onChange={(v) => set("showRsvp", v)} />
          <Toggle label="ទំនាក់ទំនង" checked={form.showContact} onChange={(v) => set("showContact", v)} />
          <Toggle label="ចែករំលែក" checked={form.showShare} onChange={(v) => set("showShare", v)} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
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

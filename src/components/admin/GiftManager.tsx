"use client";

import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { Button, Card, Field, Input, MediaUpload, StatusMessage, Textarea, Toggle, useApi } from "./ui";

/**
 * ចំណងដៃ — a single KHQR.
 *
 * KHQR is Cambodia's unified standard, so one code works from every bank and
 * wallet app. That is simpler for the guest than a list of account numbers to
 * choose between, and simpler to keep correct.
 */
export function GiftManager({ wedding }: { wedding: Wedding }) {
  const { busy, message, send } = useApi();
  const [form, setForm] = useState({
    giftEnabled: wedding.giftEnabled,
    giftIntro: wedding.giftIntro,
    giftNote: wedding.giftNote,
    giftQrMediaId: wedding.giftQrMediaId,
    giftQrUrl: wedding.giftQrUrl,
    giftAccountName: wedding.giftAccountName,
  });

  const qr = mediaSrc(form.giftQrMediaId, form.giftQrUrl);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">ចំណងដៃ</h1>
        <p className="mt-1 text-sm text-slate-500">KHQR សម្រាប់ចំណងដៃ</p>
      </header>

      <StatusMessage message={message} />

      <Card title="ការកំណត់">
        <div className="space-y-5">
          <Toggle
            label="បង្ហាញផ្នែកចំណងដៃ"
            hint="បើបិទ ផ្នែកនេះនឹងមិនបង្ហាញលើសំបុត្រអញ្ជើញទេ"
            checked={form.giftEnabled}
            onChange={(v) => setForm({ ...form, giftEnabled: v })}
          />

          <MediaUpload
            label="រូបភាព KHQR"
            currentSrc={qr}
            onUploaded={(id) => setForm({ ...form, giftQrMediaId: id, giftQrUrl: "" })}
            onClear={() => setForm({ ...form, giftQrMediaId: null, giftQrUrl: "" })}
          />
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
            ទាញយករូប KHQR ពីកម្មវិធីធនាគាររបស់លោកអ្នក (ABA, ACLEDA, Wing …) រួចផ្ទុកនៅទីនេះ។
            KHQR មួយអាចស្កេនបានពីគ្រប់កម្មវិធីធនាគារនៅកម្ពុជា។
          </p>

          <Field label="ឬបញ្ចូល URL រូបភាព KHQR">
            <Input
              value={form.giftQrUrl}
              placeholder="https://..."
              onChange={(e) => setForm({ ...form, giftQrUrl: e.target.value })}
            />
          </Field>

          <Field label="ឈ្មោះគណនី" hint="បង្ហាញនៅក្រោម QR (ស្រេចចិត្ត)">
            <Input
              value={form.giftAccountName}
              placeholder="SOK VISAL"
              onChange={(e) => setForm({ ...form, giftAccountName: e.target.value })}
            />
          </Field>

          <Field label="អត្ថបទណែនាំ">
            <Textarea
              rows={2}
              value={form.giftIntro}
              onChange={(e) => setForm({ ...form, giftIntro: e.target.value })}
            />
          </Field>
          <Field label="អត្ថបទបន្ថែម">
            <Textarea
              rows={2}
              value={form.giftNote}
              onChange={(e) => setForm({ ...form, giftNote: e.target.value })}
            />
          </Field>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                send("/api/admin/wedding", {
                  method: "PUT",
                  body: JSON.stringify(form),
                  successText: "បានរក្សាទុក",
                })
              }
            >
              រក្សាទុក
            </Button>
          </div>
        </div>
      </Card>

      {qr && (
        <Card title="ការបង្ហាញជាមុន">
          <div className="mx-auto max-w-[17rem] rounded-2xl border border-slate-200 px-5 py-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="KHQR" className="mx-auto w-full max-w-[13rem] rounded-xl" />
            {form.giftAccountName && (
              <p className="mt-3 text-sm font-medium text-slate-700">{form.giftAccountName}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

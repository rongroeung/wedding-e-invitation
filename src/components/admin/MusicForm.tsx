"use client";

import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { Button, Card, Field, Input, MediaUpload, StatusMessage, Toggle, useApi } from "./ui";

import { useT } from "./AdminPrefs";
/** Background-music settings. */
export function MusicForm({ wedding }: { wedding: Wedding }) {
  const t = useT();
  const { busy, message, send } = useApi();
  const [form, setForm] = useState({
    musicEnabled: wedding.musicEnabled,
    musicTitle: wedding.musicTitle,
    musicUrl: wedding.musicUrl,
    musicMediaId: wedding.musicMediaId,
    preMusicEnabled: wedding.preMusicEnabled,
    preMusicUrl: wedding.preMusicUrl,
    preMusicMediaId: wedding.preMusicMediaId,
    preMusicLoop: wedding.preMusicLoop,
  });
  const save = () =>
    send("/api/admin/wedding", {
      method: "PUT",
      body: JSON.stringify(form),
      successText: t("បានរក្សាទុក"),
    });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">{t("ភ្លេងផ្ទៃខាងក្រោយ")}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("ភ្លេងនឹងចាប់ផ្ដើមតែពេលភ្ញៀវចុចបើកសំបុត្រប៉ុណ្ណោះ (តាមលក្ខខណ្ឌរបស់កម្មវិធីរុករក)")}</p>
      </header>

      <StatusMessage message={message} />

      <Card title={t("ការកំណត់")}>
        <div className="space-y-4">
          <Toggle
            label={t("បើកភ្លេងផ្ទៃខាងក្រោយ")}
            checked={form.musicEnabled}
            onChange={(v) => setForm({ ...form, musicEnabled: v })}
          />
          <Field label={t("ឈ្មោះបទចម្រៀង")}>
            <Input value={form.musicTitle} onChange={(e) => setForm({ ...form, musicTitle: e.target.value })} />
          </Field>
          <MediaUpload
            label={t("ផ្ទុកឯកសារភ្លេង (MP3 អតិបរមា 12MB)")}
            kind="audio"
            currentSrc={mediaSrc(form.musicMediaId, form.musicUrl)}
            onUploaded={(id) => setForm({ ...form, musicMediaId: id })}
            onClear={() => setForm({ ...form, musicMediaId: null, musicUrl: "" })}
          />
          <Field label={t("ឬបញ្ចូល URL ភ្លេង")}>
            <Input
              value={form.musicUrl}
              onChange={(e) => setForm({ ...form, musicUrl: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          <div className="flex justify-end">
            <Button type="button" disabled={busy} onClick={save}>
              {t("រក្សាទុក")}</Button>
          </div>
        </div>
      </Card>

      <Card
        title={t("សំឡេងបើកសំបុត្រ")}
        description={t("ចាក់នៅទំព័រដំបូង មុនភ្ញៀវចុច «បើកសំបុត្រអញ្ជើញ» ហើយបញ្ឈប់ពេលបើក រួចភ្លេងផ្ទៃខាងក្រោយបន្ត")}
      >
        <div className="space-y-4">
          <Toggle
            label={t("បើកសំឡេងបើកសំបុត្រ")}
            checked={form.preMusicEnabled}
            onChange={(v) => setForm({ ...form, preMusicEnabled: v })}
          />
          <MediaUpload
            label={t("ផ្ទុកឯកសារសំឡេង (MP3 អតិបរមា 12MB)")}
            kind="audio"
            currentSrc={mediaSrc(form.preMusicMediaId, form.preMusicUrl)}
            onUploaded={(id) => setForm({ ...form, preMusicMediaId: id })}
            onClear={() => setForm({ ...form, preMusicMediaId: null, preMusicUrl: "" })}
          />
          <Field label={t("ឬបញ្ចូល URL សំឡេង")}>
            <Input
              value={form.preMusicUrl}
              onChange={(e) => setForm({ ...form, preMusicUrl: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          <Toggle
            label={t("ចាក់វិលជុំ រហូតដល់ភ្ញៀវបើក")}
            hint={t("បិទ = ចាក់តែម្ដង (សមស្របសម្រាប់សំឡេងខ្លី)")}
            checked={form.preMusicLoop}
            onChange={(v) => setForm({ ...form, preMusicLoop: v })}
          />
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            {t("កម្មវិធីរុករកមិនអនុញ្ញាតឱ្យចាក់សំឡេងដោយខ្លួនឯង មុនភ្ញៀវប៉ះអេក្រង់ទេ។ សំឡេងនឹងព្យាយាមចាក់ភ្លាម ហើយបើត្រូវបានរារាំង វានឹងចាប់ផ្ដើមនៅពេលភ្ញៀវប៉ះអេក្រង់ជាលើកដំបូង។")}
          </p>
          <div className="flex justify-end">
            <Button type="button" disabled={busy} onClick={save}>
              {t("រក្សាទុក")}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

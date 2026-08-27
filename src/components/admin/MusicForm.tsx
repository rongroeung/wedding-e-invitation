"use client";

import { useState } from "react";
import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { Button, Card, Field, Input, MediaUpload, StatusMessage, Toggle, useApi } from "./ui";

/** Background-music settings. */
export function MusicForm({ wedding }: { wedding: Wedding }) {
  const { busy, message, send } = useApi();
  const [form, setForm] = useState({
    musicEnabled: wedding.musicEnabled,
    musicTitle: wedding.musicTitle,
    musicUrl: wedding.musicUrl,
    musicMediaId: wedding.musicMediaId,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">ភ្លេងផ្ទៃខាងក្រោយ</h1>
        <p className="mt-1 text-sm text-slate-500">
          ភ្លេងនឹងចាប់ផ្ដើមតែពេលភ្ញៀវចុចបើកសំបុត្រប៉ុណ្ណោះ (តាមលក្ខខណ្ឌរបស់កម្មវិធីរុករក)
        </p>
      </header>

      <StatusMessage message={message} />

      <Card title="ការកំណត់">
        <div className="space-y-4">
          <Toggle
            label="បើកភ្លេងផ្ទៃខាងក្រោយ"
            checked={form.musicEnabled}
            onChange={(v) => setForm({ ...form, musicEnabled: v })}
          />
          <Field label="ឈ្មោះបទចម្រៀង">
            <Input value={form.musicTitle} onChange={(e) => setForm({ ...form, musicTitle: e.target.value })} />
          </Field>
          <MediaUpload
            label="ផ្ទុកឯកសារភ្លេង (MP3 អតិបរមា 12MB)"
            kind="audio"
            currentSrc={mediaSrc(form.musicMediaId, form.musicUrl)}
            onUploaded={(id) => setForm({ ...form, musicMediaId: id })}
            onClear={() => setForm({ ...form, musicMediaId: null, musicUrl: "" })}
          />
          <Field label="ឬបញ្ចូល URL ភ្លេង">
            <Input
              value={form.musicUrl}
              onChange={(e) => setForm({ ...form, musicUrl: e.target.value })}
              placeholder="https://..."
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
    </div>
  );
}

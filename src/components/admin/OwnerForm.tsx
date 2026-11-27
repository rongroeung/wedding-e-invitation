"use client";

import { useState } from "react";
import type { OwnerLink, SystemOwner as Owner } from "@/lib/db/schema";
import { SystemOwner } from "@/components/invitation/SystemOwner";
import { useT } from "./AdminPrefs";
import { Button, Card, Field, Input, StatusMessage, Textarea, Toggle, useApi } from "./ui";

type Form = Omit<Owner, "updatedAt" | "id">;
const MAX_LINKS = 8;

/**
 * The system owner (admin → ម្ចាស់ប្រព័ន្ធ, main workspace only): the message
 * and contact details shown at the end of every invitation on the site.
 */
export function OwnerForm({ owner }: { owner: Omit<Owner, "updatedAt"> & { updatedAt: string } }) {
  const t = useT();
  const { busy, message, send } = useApi();
  const [form, setForm] = useState<Form>({
    enabled: owner.enabled,
    message: owner.message,
    phone: owner.phone,
    telegram: owner.telegram,
    instagram: owner.instagram,
    facebook: owner.facebook,
    tiktok: owner.tiktok,
    youtube: owner.youtube,
    website: owner.website,
    links: owner.links ?? [],
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setLink = (i: number, patch: Partial<OwnerLink>) =>
    set("links", form.links.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const fields: { key: "phone" | "telegram" | "instagram" | "facebook" | "tiktok" | "youtube" | "website"; label: string; placeholder: string }[] = [
    { key: "phone", label: t("លេខទូរស័ព្ទ"), placeholder: "+855 12 345 678" },
    { key: "telegram", label: "Telegram", placeholder: t("ឈ្មោះអ្នកប្រើ ឬ តំណ https://t.me/…") },
    { key: "instagram", label: "Instagram", placeholder: t("ឈ្មោះអ្នកប្រើ ឬ តំណ") },
    { key: "facebook", label: "Facebook", placeholder: t("ឈ្មោះទំព័រ ឬ តំណ") },
    { key: "tiktok", label: "TikTok", placeholder: t("ឈ្មោះអ្នកប្រើ ឬ តំណ") },
    { key: "youtube", label: "YouTube", placeholder: t("ឈ្មោះឆានែល ឬ តំណ") },
    { key: "website", label: t("គេហទំព័រ"), placeholder: "https://…" },
  ];

  return (
    <div className="space-y-6">
      <Card
        title={t("ម្ចាស់ប្រព័ន្ធ")}
        description={t("បង្ហាញនៅចុងបញ្ចប់នៃសំបុត្រអញ្ជើញនីមួយៗ នៅក្នុងគ្រប់កន្លែងធ្វើការ · ប្រអប់ដែលទុកទទេ មិនបង្ហាញទេ")}
      >
        <div className="space-y-4">
          <Toggle
            label={t("បង្ហាញព័ត៌មានម្ចាស់ប្រព័ន្ធនៅលើសំបុត្រ")}
            checked={form.enabled}
            onChange={(v) => set("enabled", v)}
          />
          <Field label={t("សារ")}>
            <Textarea rows={3} value={form.message} maxLength={600} onChange={(e) => set("message", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <Field key={f.key} label={f.label}>
                <Input
                  value={form[f.key]}
                  placeholder={f.placeholder}
                  maxLength={f.key === "phone" ? 40 : 300}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </Field>
            ))}
          </div>
        </div>
      </Card>

      <Card
        title={`${t("បណ្ដាញសង្គមផ្សេងទៀត")} (${form.links.length}/${MAX_LINKS})`}
        description={t("ឈ្មោះ និងតំណពេញ (https://…) ឧ. LINE, WhatsApp, X")}
      >
        <div className="space-y-3">
          {form.links.map((l, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Input
                value={l.label}
                placeholder={t("ឈ្មោះ")}
                maxLength={40}
                onChange={(e) => setLink(i, { label: e.target.value })}
                className="w-40"
                aria-label={t("ឈ្មោះ")}
              />
              <Input
                value={l.url}
                placeholder="https://…"
                maxLength={400}
                onChange={(e) => setLink(i, { url: e.target.value })}
                className="min-w-[12rem] flex-1"
                aria-label="URL"
              />
              <Button
                type="button"
                variant="danger"
                className="!px-2.5"
                onClick={() => set("links", form.links.filter((_, k) => k !== i))}
                aria-label={t("លុប")}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            disabled={form.links.length >= MAX_LINKS}
            onClick={() => set("links", [...form.links, { label: "", url: "" }])}
          >
            {t("+ បន្ថែមតំណ")}
          </Button>
        </div>
      </Card>

      <Card title={t("មើលជាមុន")}>
        <div className="admin-keep overflow-hidden rounded-xl bg-[#f8f2e7]">
          {form.enabled ? (
            <SystemOwner owner={{ ...form, id: "site", updatedAt: new Date() }} />
          ) : (
            <p className="px-4 py-8 text-center text-sm text-slate-500">{t("បិទ — មិនបង្ហាញនៅលើសំបុត្រទេ")}</p>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <StatusMessage message={message} />
        <Button
          type="button"
          disabled={busy}
          onClick={() =>
            send("/api/admin/owner", {
              method: "PUT",
              body: JSON.stringify({
                ...form,
                links: form.links.filter((l) => l.label.trim() || l.url.trim()),
              }),
              successText: t("បានរក្សាទុក"),
            })
          }
        >
          {t("រក្សាទុក")}
        </Button>
      </div>
    </div>
  );
}

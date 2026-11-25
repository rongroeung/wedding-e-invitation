"use client";

import { useState } from "react";
import type { DressColor, DressGroup, Wedding } from "@/lib/db/schema";
import {
  MAX_DRESS_COLORS,
  MAX_DRESS_GROUPS,
  dressGroupList,
  dressImageSrc,
  dressLayout,
  dressPalette,
} from "@/lib/dressColors";
import { DressPalette } from "@/components/invitation/DressColors";
import { Button, Card, Field, Input, MediaUpload, Select, StatusMessage, Textarea, Toggle, useApi } from "./ui";

import { useT } from "./AdminPrefs";
/**
 * ពណ៌សម្លៀកបំពាក់ — the wedding's colours, so guests can dress to match.
 *
 * Up to twelve colours, each with an optional name and an optional photo of
 * the fabric, in the order they should appear, optionally split into groups
 * (e.g. evening and morning attire, each with its date). Neighbouring colours
 * with the same name share one label. The section stays off the invitation
 * until there is at least one colour.
 */
export function DressColorsManager({ wedding }: { wedding: Wedding }) {
  const t = useT();
  const { busy, message, send } = useApi();
  const [enabled, setEnabled] = useState(wedding.dressCodeEnabled);
  const [title, setTitle] = useState(wedding.dressCodeTitle);
  const [note, setNote] = useState(wedding.dressCodeNote);
  const [colors, setColors] = useState<DressColor[]>(dressPalette(wedding.dressColors));
  const [groups, setGroups] = useState<DressGroup[]>(dressGroupList(wedding.dressGroups));
  const updateGroup = (i: number, patch: Partial<DressGroup>) =>
    setGroups((list) => list.map((g, k) => (k === i ? { ...g, ...patch } : g)));
  /* removing a group moves its colours to the one before it */
  const removeGroup = (i: number) => {
    setGroups((list) => list.filter((_, k) => k !== i));
    setColors((list) =>
      list.map((c) => {
        const g = c.group ?? 0;
        return g < i ? c : { ...c, group: Math.max(0, g - 1) };
      }),
    );
  };

  const update = (i: number, patch: Partial<DressColor>) =>
    setColors((list) => list.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const move = (i: number, by: number) =>
    setColors((list) => {
      const j = i + by;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const valid = colors.every((c) => /^#[0-9a-f]{6}$/i.test(c.hex));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">{t("ពណ៌សម្លៀកបំពាក់")}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("ពណ៌នៃពិធីមង្គលការ ដើម្បីឱ្យភ្ញៀវជ្រើសរើសសម្លៀកបំពាក់ឱ្យត្រូវគ្នា")}<span className="block text-xs text-slate-400">Your wedding colours, so guests can dress to match.</span>
        </p>
      </header>

      <StatusMessage message={message} />

      <Card title={t("ការកំណត់")}>
        <div className="space-y-5">
          <Toggle
            label={t("បង្ហាញផ្នែកពណ៌សម្លៀកបំពាក់")}
            hint={t("ផ្នែកនេះបង្ហាញតែពេលមានពណ៌យ៉ាងតិចមួយ")}
            checked={enabled}
            onChange={setEnabled}
          />
          <Field label={t("ចំណងជើង")}>
            <Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label={t("សារជូនភ្ញៀវ (ស្រេចចិត្ត)")} hint={t("ឧ. ពណ៌ដែលសូមឱ្យស្លៀក ឬពណ៌ដែលសូមជៀសវាង")}>
            <Textarea rows={2} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card
        title={`${t("ក្រុមពណ៌")} (${groups.length}/${MAX_DRESS_GROUPS})`}
        description={t("ស្រេចចិត្ត · ចែកពណ៌ជាក្រុម ឧ. តាមថ្ងៃ ដោយមានចំណងជើង និងបន្ទាត់ខាងក្រោម · Optional: split the colours into groups, e.g. by day")}
      >
        <div className="space-y-3">
          {groups.length === 0 && <p className="text-sm text-slate-400">{t("គ្មានក្រុម — ពណ៌ទាំងអស់បង្ហាញជាមួយគ្នា")}</p>}
          {groups.map((g, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2.5">
              <span className="w-14 shrink-0 text-xs text-slate-500">{t("ក្រុម ")}{i + 1}</span>
              <Input
                value={g.title}
                placeholder={t("ចំណងជើង ឧ. Evening Attire")}
                maxLength={80}
                onChange={(e) => updateGroup(i, { title: e.target.value })}
                aria-label={t("ចំណងជើងក្រុម")}
                className="min-w-[10rem] flex-1"
              />
              <Input
                value={g.note}
                placeholder={t("បន្ទាត់ខាងក្រោម ឧ. ថ្ងៃខែ")}
                maxLength={80}
                onChange={(e) => updateGroup(i, { note: e.target.value })}
                aria-label={t("បន្ទាត់ខាងក្រោម")}
                className="min-w-[10rem] flex-1"
              />
              <Button type="button" variant="danger" className="!px-2.5" onClick={() => removeGroup(i)} aria-label="Remove group">
                ✕
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            disabled={groups.length >= MAX_DRESS_GROUPS}
            onClick={() => setGroups((l) => [...l, { title: "", note: "" }])}
          >
            {t("+ បន្ថែមក្រុម")}</Button>
        </div>
      </Card>

      <Card
        title={`${t("ពណ៌")} (${colors.length}/${MAX_DRESS_COLORS})`}
        description={t("ជ្រើសពណ៌ ដាក់ឈ្មោះ និងរូបក្រណាត់ (ស្រេចចិត្ត) · ពណ៌ជាប់គ្នាដែលមានឈ្មោះដូចគ្នា បង្ហាញឈ្មោះតែម្ដង · Pick a colour, and optionally a name and a photo of the fabric; neighbouring colours with the same name share one label")}
      >
        <div className="space-y-3">
          {colors.length === 0 && <p className="text-sm text-slate-400">{t("មិនទាន់មានពណ៌")}</p>}
          {colors.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2.5">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#000000"}
                onChange={(e) => update(i, { hex: e.target.value })}
                aria-label={`${t("ពណ៌ទី")} ${i + 1}`}
                className="h-10 w-12 shrink-0 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
              />
              <Input
                value={c.hex}
                onChange={(e) => update(i, { hex: e.target.value.trim() })}
                aria-label="Hex"
                className="!w-28 font-mono"
                maxLength={7}
              />
              <Input
                value={c.name}
                placeholder={t("ឈ្មោះពណ៌ ឧ. ខៀវស្រាល")}
                maxLength={40}
                onChange={(e) => update(i, { name: e.target.value })}
                aria-label={t("ឈ្មោះពណ៌")}
                className="min-w-[10rem] flex-1"
              />
              {groups.length > 0 && (
                <Select
                  value={String(Math.min(c.group ?? 0, groups.length - 1))}
                  onChange={(e) => update(i, { group: Number(e.target.value) })}
                  aria-label={t("ក្រុម")}
                  className="!w-auto"
                >
                  {groups.map((g, k) => (
                    <option key={k} value={k}>
                      {g.title || `${t("ក្រុម")} ${k + 1}`}
                    </option>
                  ))}
                </Select>
              )}
              <div className="flex gap-1">
                <Button type="button" variant="ghost" className="!px-2.5" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  ↑
                </Button>
                <Button type="button" variant="ghost" className="!px-2.5" onClick={() => move(i, 1)} disabled={i === colors.length - 1} aria-label="Move down">
                  ↓
                </Button>
                <Button type="button" variant="danger" className="!px-2.5" onClick={() => setColors((l) => l.filter((_, k) => k !== i))} aria-label="Remove">
                  ✕
                </Button>
              </div>
              <div className="w-full">
                <MediaUpload
                  label={t("រូបក្រណាត់ (ស្រេចចិត្ត)")}
                  currentSrc={dressImageSrc(c) || undefined}
                  onUploaded={(mediaId) => update(i, { mediaId, image: undefined })}
                  onClear={() => update(i, { mediaId: undefined, image: undefined })}
                />
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              disabled={colors.length >= MAX_DRESS_COLORS}
              onClick={() => setColors((l) => [...l, { hex: "#c29a5b", name: "" }])}
            >
              {t("+ បន្ថែមពណ៌")}</Button>
            <Button
              type="button"
              disabled={busy || !valid}
              onClick={() =>
                send("/api/admin/wedding", {
                  method: "PUT",
                  body: JSON.stringify({
                    dressCodeEnabled: enabled,
                    dressCodeTitle: title,
                    dressCodeNote: note,
                    dressGroups: groups.map((g) => ({ title: g.title.trim(), note: g.note.trim() })),
                    dressColors: colors.map((c) => ({
                      hex: c.hex.toLowerCase(),
                      name: c.name.trim(),
                      ...(groups.length ? { group: Math.min(c.group ?? 0, groups.length - 1) } : {}),
                      ...(c.mediaId ? { mediaId: c.mediaId } : c.image ? { image: c.image } : {}),
                    })),
                  }),
                  successText: t("បានរក្សាទុក"),
                })
              }
            >
              {t("រក្សាទុក")}</Button>
          </div>
          {!valid && <p className="text-xs text-red-600">{t("លេខកូដពណ៌ត្រូវជាទម្រង់ #RRGGBB")}</p>}
        </div>
      </Card>

      {colors.length > 0 && valid && (
        <Card title={t("ការបង្ហាញជាមុន")}>
          <div className="admin-keep rounded-xl bg-[#f8f2e7] px-4 py-8">
            <p className="mb-6 text-center text-base text-[#7b5a2e]">{title || "ពណ៌សម្លៀកបំពាក់"}</p>
            {note && <p className="mx-auto mb-6 max-w-md text-center text-sm text-slate-600">{note}</p>}
            <div className="dress-sections">
              {dressLayout(colors, groups).map((sec, i) => (
                <div key={i}>
                  {sec.group && (sec.group.title || sec.group.note) && (
                    <div className="dress-group-head">
                      {sec.group.title && <p className="dress-group-title !text-[#7b5a2e]">{sec.group.title}</p>}
                      {sec.group.note && <p className="dress-group-note text-slate-600">{sec.group.note}</p>}
                    </div>
                  )}
                  <DressPalette runs={sec.runs} nameClass="text-slate-700" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { workspacePath } from "@/lib/workspacePath";
import { Button, Card, Field, Input, StatusMessage, useApi } from "./ui";

type Admin = { id: string; email: string; name: string; isOwner: boolean };
type Row = { id: string; slug: string; name: string; label: string; createdAt: string; guests: number; admins: Admin[] };

/**
 * កន្លែងធ្វើការទាំងអស់ — the owner's page. One workspace per wedding: create
 * one (with its first admin, if you like), rename it or move its address,
 * give it admins or take them away, and delete it. The first workspace is the
 * site's own address ("/") and can be neither moved nor deleted.
 */
export function WorkspaceManager({ workspaces, current, siteUrl }: { workspaces: Row[]; current: string | null; siteUrl: string }) {
  const { busy, message, send } = useApi();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const result = await send("/api/admin/workspaces", {
      method: "POST",
      body: JSON.stringify({ slug, name, adminEmail, adminName, adminPassword }),
      successText: "បានបង្កើតកន្លែងធ្វើការថ្មី",
    });
    if (result) {
      setSlug("");
      setName("");
      setAdminEmail("");
      setAdminName("");
      setAdminPassword("");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">កន្លែងធ្វើការទាំងអស់</h1>
        <p className="mt-1 text-sm text-slate-500">
          ពិធីមង្គលការនីមួយៗមានកន្លែងធ្វើការផ្ទាល់ខ្លួន៖ ព័ត៌មាន ភ្ញៀវ តំណអញ្ជើញ និងគណនីគ្រប់គ្រងដាច់ដោយឡែក។
          <span className="block text-xs text-slate-400">One workspace per wedding — its own details, guests, links and admins.</span>
        </p>
      </header>

      <StatusMessage message={message} />

      <Card title="បង្កើតកន្លែងធ្វើការថ្មី" description="New workspace — its invitation will be at /w/<address>">
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
          <Field label="អាសយដ្ឋាន (address)" hint="a–z, 0–9, -">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. dara-sophea" required />
          </Field>
          <Field label="ឈ្មោះ (name in the dashboard)">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="អ៊ីមែលអ្នកគ្រប់គ្រង (optional)" hint="existing account, or a new one">
            <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="ឈ្មោះអ្នកគ្រប់គ្រង">
            <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="ពាក្យសម្ងាត់ (new account only)">
            <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={busy || !slug.trim()}>
              បង្កើត
            </Button>
          </div>
        </form>
      </Card>

      {workspaces.map((w) => (
        <WorkspaceCard key={w.id} w={w} isCurrent={w.id === current} siteUrl={siteUrl} send={send} busy={busy} />
      ))}
    </div>
  );
}

function WorkspaceCard({
  w,
  isCurrent,
  siteUrl,
  send,
  busy,
}: {
  w: Row;
  isCurrent: boolean;
  siteUrl: string;
  send: ReturnType<typeof useApi>["send"];
  busy: boolean;
}) {
  const isDefault = w.id === "main";
  const [name, setName] = useState(w.name);
  const [slug, setSlug] = useState(w.slug);
  const [email, setEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const address = `${siteUrl.replace(/\/$/, "")}${workspacePath(w.slug)}`;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    await send(`/api/admin/workspaces/${w.id}`, {
      method: "PATCH",
      body: JSON.stringify(isDefault ? { name } : { name, slug }),
    });
  }
  async function addAdmin(event: React.FormEvent) {
    event.preventDefault();
    const result = await send(`/api/admin/workspaces/${w.id}/members`, {
      method: "POST",
      body: JSON.stringify({ email, name: adminName, password }),
      successText: "បានបន្ថែមអ្នកគ្រប់គ្រង",
    });
    if (result) {
      setEmail("");
      setAdminName("");
      setPassword("");
    }
  }
  async function switchTo() {
    await send("/api/admin/workspace/switch", { method: "POST", body: JSON.stringify({ id: w.id }), successText: "បានប្ដូរ" });
  }

  return (
    <Card
      title={`${w.label}${isCurrent ? " · កំពុងគ្រប់គ្រង" : ""}`}
      description={`${address} · ភ្ញៀវ ${w.guests}`}
      actions={
        <div className="flex gap-2">
          <a href={workspacePath(w.slug)} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            មើល ↗
          </a>
          {!isCurrent && (
            <Button type="button" variant="ghost" onClick={switchTo} disabled={busy}>
              គ្រប់គ្រងកន្លែងនេះ
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-3">
          <Field label="ឈ្មោះ">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="អាសយដ្ឋាន" hint={isDefault ? "the site's own address (/)" : "/w/<address>"}>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} disabled={isDefault} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="ghost" disabled={busy}>
              រក្សាទុក
            </Button>
          </div>
        </form>

        <div>
          <p className="text-sm font-medium text-slate-700">អ្នកគ្រប់គ្រង · Admins</p>
          <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {w.admins.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">មិនទាន់មាន</li>}
            {w.admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  {a.name} · <span className="text-slate-500">{a.email}</span>
                  {a.isOwner && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800">owner</span>}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    send(`/api/admin/workspaces/${w.id}/members?userId=${encodeURIComponent(a.id)}`, {
                      method: "DELETE",
                      successText: "បានដកចេញ",
                    })
                  }
                  className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  ដកចេញ
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={addAdmin} className="mt-3 grid gap-3 sm:grid-cols-4">
            <Input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" aria-label="Admin email" />
            <Input placeholder="name" value={adminName} onChange={(e) => setAdminName(e.target.value)} autoComplete="off" aria-label="Admin name" />
            <Input type="password" placeholder="password (new account)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" aria-label="Password for a new account" />
            <Button type="submit" variant="ghost" disabled={busy}>
              បន្ថែមអ្នកគ្រប់គ្រង
            </Button>
          </form>
        </div>

        {!isDefault && (
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
            <p className="text-sm text-red-800">
              លុបកន្លែងធ្វើការនេះ និងទិន្នន័យទាំងអស់ (ភ្ញៀវ ការឆ្លើយតប រូបភាព)។ វាយ <code className="font-mono">{w.slug}</code> ដើម្បីបញ្ជាក់។
            </p>
            <div className="mt-2 flex gap-2">
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={w.slug} aria-label="Type the address to confirm" />
              <Button
                type="button"
                variant="danger"
                disabled={busy || confirm !== w.slug}
                onClick={() =>
                  send(`/api/admin/workspaces/${w.id}`, { method: "DELETE", body: JSON.stringify({ confirm }), successText: "បានលុប" })
                }
              >
                លុប
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

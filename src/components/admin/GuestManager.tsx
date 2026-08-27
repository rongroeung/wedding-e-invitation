"use client";

import { useMemo, useState } from "react";
import type { Guest, Rsvp } from "@/lib/db/schema";
import { Button, Card, Field, Input, Select, StatusMessage, Textarea, useApi } from "./ui";

const TITLES = ["លោក", "លោកស្រី", "កញ្ញា", "អ្នកនាង", "ឯកឧត្តម", "លោកជំទាវ", "លោកគ្រូ", "អ្នកគ្រូ"];

/** Guest list, personalised invitation links and QR codes. */
export function GuestManager({
  guests,
  rsvps,
  siteUrl,
}: {
  guests: Guest[];
  rsvps: Rsvp[];
  siteUrl: string;
}) {
  const { busy, message, send, setMessage } = useApi();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({
    title: "លោក",
    name: "",
    nameLatin: "",
    allowedSeats: 1,
    notes: "",
  });
  const [bulk, setBulk] = useState("");
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);

  const rsvpByCode = useMemo(() => {
    const map = new Map<string, Rsvp>();
    for (const rsvp of rsvps) if (rsvp.guestCode && !map.has(rsvp.guestCode)) map.set(rsvp.guestCode, rsvp);
    return map;
  }, [rsvps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.nameLatin.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q),
    );
  }, [guests, query]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: "ok", text: "បានចម្លងតំណ" });
      setTimeout(() => setMessage(null), 2500);
    } catch {
      setMessage({ type: "error", text: "មិនអាចចម្លងបានទេ" });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">ភ្ញៀវ & តំណអញ្ជើញ</h1>
          <p className="mt-1 text-sm text-slate-500">ភ្ញៀវសរុប {guests.length} នាក់</p>
        </div>
        <a
          href="/api/admin/export?type=guests"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ទាញយក CSV
        </a>
      </header>

      <StatusMessage message={message} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="បន្ថែមភ្ញៀវម្នាក់"
          description="ប្រព័ន្ធនឹងបង្កើតលេខកូដអញ្ជើញចៃដន្យដោយស្វ័យប្រវត្តិ"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ងារ">
              <Select value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}>
                {TITLES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="ឈ្មោះ">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="ឈ្មោះជាអក្សរឡាតាំង" hint="ស្រេចចិត្ត — បង្ហាញនៅលើគម្រប">
              <Input
                value={draft.nameLatin}
                placeholder="Mr. Theng Rathrongroeung"
                onChange={(e) => setDraft({ ...draft, nameLatin: e.target.value })}
              />
            </Field>
            <Field label="ចំនួនកៅអី">
              <Input
                type="number"
                min={1}
                max={20}
                value={draft.allowedSeats}
                onChange={(e) => setDraft({ ...draft, allowedSeats: Number(e.target.value) })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="កំណត់ចំណាំ">
                <Input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              disabled={busy || !draft.name.trim()}
              onClick={async () => {
                const result = await send("/api/admin/guests", {
                  method: "POST",
                  body: JSON.stringify(draft),
                  successText: "បានបន្ថែមភ្ញៀវ",
                });
                if (result)
                  setDraft({ title: draft.title, name: "", nameLatin: "", allowedSeats: 1, notes: "" });
              }}
            >
              បន្ថែម
            </Button>
          </div>
        </Card>

        <Card title="នាំចូលភ្ញៀវច្រើននាក់" description="មួយបន្ទាត់ក្នុងមួយនាក់៖ ឈ្មោះ, ចំនួនកៅអី">
          <Textarea
            rows={7}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"ថេង រ័ត្នរង្សីរឿង, 2\nចាន់ ដារ៉ា, 1"}
          />
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              disabled={busy || !bulk.trim()}
              onClick={async () => {
                const result = await send("/api/admin/guests", {
                  method: "POST",
                  body: JSON.stringify({ text: bulk, title: draft.title }),
                  successText: "បាននាំចូលភ្ញៀវ",
                });
                if (result) setBulk("");
              }}
            >
              នាំចូល
            </Button>
          </div>
        </Card>
      </div>

      <Card
        title="បញ្ជីភ្ញៀវ"
        actions={
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះ / កូដ"
            className="w-full sm:w-64"
          />
        }
      >
        <div className="space-y-3">
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-400">រកមិនឃើញភ្ញៀវទេ</p>}
          {filtered.map((guest) => {
            const link = `${siteUrl}/invite/${guest.code}`;
            const rsvp = rsvpByCode.get(guest.code);
            return (
              <div key={guest.id} className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {guest.title} {guest.name}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {guest.allowedSeats} កៅអី · មើល {guest.views} ដង
                      </span>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      <span className="font-mono text-slate-600">{guest.code}</span>
                      <span className="ml-2 text-slate-400">{link}</span>
                    </p>
                    {guest.nameLatin && <p className="text-xs text-slate-400">{guest.nameLatin}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {rsvp ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          rsvp.attending ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {rsvp.attending ? `ចូលរួម ${rsvp.guestCount} នាក់` : "មិនអាចចូលរួម"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                        មិនទាន់ឆ្លើយតប
                      </span>
                    )}
                    <Button variant="ghost" type="button" onClick={() => copy(link)}>ចម្លងតំណ</Button>
                    <Button variant="ghost" type="button" onClick={() => setQrGuest(guest)}>QR</Button>
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={busy}
                      title="បង្កើតលេខកូដថ្មី (តំណចាស់នឹងលែងដំណើរការ)"
                      onClick={() =>
                        send(`/api/admin/guests/${guest.id}`, {
                          method: "PUT",
                          body: JSON.stringify({ regenerateCode: true }),
                          successText: "បានបង្កើតតំណថ្មី",
                        })
                      }
                    >
                      កូដថ្មី
                    </Button>
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(link)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Telegram
                    </a>
                    <Button
                      variant="danger"
                      type="button"
                      disabled={busy}
                      onClick={() => send(`/api/admin/guests/${guest.id}`, { method: "DELETE", successText: "បានលុប" })}
                    >
                      លុប
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {qrGuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setQrGuest(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-slate-800">
              QR Code សម្រាប់អញ្ជើញភ្ញៀវ
            </p>
            <p className="mt-1 text-xs text-slate-500">{qrGuest.title} {qrGuest.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/qr?code=${encodeURIComponent(qrGuest.code)}`}
              alt="QR Code"
              className="mx-auto mt-4 h-56 w-56"
            />
            <div className="mt-5 flex justify-center gap-2">
              <a
                href={`/api/admin/qr?code=${encodeURIComponent(qrGuest.code)}&download=1`}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
              >
                ទាញយក PNG
              </a>
              <Button variant="ghost" type="button" onClick={() => setQrGuest(null)}>បិទ</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

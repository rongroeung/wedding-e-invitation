"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Guest, Rsvp } from "@/lib/db/schema";
import { CAPTION_TOKENS, DEFAULT_CAPTION, captionWithoutLink, renderCaption } from "@/lib/shareCaption";
import { Button, Card, Field, Input, Select, StatusMessage, Textarea, useApi } from "./ui";
import {
  DEFAULT_GUEST_TITLES,
  MAX_CUSTOM_TITLES,
  NO_TITLE,
  guestDisplayName,
  guestTitleList,
  parseGuestLines,
} from "@/lib/guestTitles";

import { useT } from "./AdminPrefs";
/*
 * A link action just used for a guest (copied the message, shared, opened
 * Telegram…) shows green with a tick for a few seconds, then returns to normal.
 */
type Action = "message" | "link" | "share" | "qr" | "telegram" | "regen";
const MARK_MS = 6000;

function useMarks() {
  const [marks, setMarks] = useState<Record<string, true>>({});
  const timers = useRef(new Map<string, number>());
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => clearTimeout(id));
  }, []);
  const keyOf = (g: Guest, a: Action) => `${g.id}:${a}`;
  return {
    done: (g: Guest, a: Action) => Boolean(marks[keyOf(g, a)]),
    mark: (g: Guest, a: Action) => {
      const k = keyOf(g, a);
      setMarks((m) => ({ ...m, [k]: true }));
      // clicked again: the few seconds start over
      clearTimeout(timers.current.get(k));
      timers.current.set(
        k,
        window.setTimeout(() => {
          timers.current.delete(k);
          setMarks(({ [k]: _gone, ...rest }) => rest);
        }, MARK_MS),
      );
    },
  };
}
/* a used action: green, with a tick */
const DONE = "!border-emerald-300 !bg-emerald-50 !text-emerald-700 hover:!bg-emerald-100";

/** Guest list, personalised invitation links and QR codes. */
export function GuestManager({
  guests,
  rsvps,
  siteUrl,
  caption,
  titles: savedTitles,
}: {
  /** The couple's own honorifics, added to the built-in ones. */
  titles: string[];
  guests: Guest[];
  rsvps: Rsvp[];
  siteUrl: string;
  /** The saved message template and the wedding details it can fill in. */
  caption: { template: string; couple: string; date: string; venue: string; address: string };
}) {
  const t = useT();
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
  const [bulkTitle, setBulkTitle] = useState("លោក");
  const marks = useMarks();

  /* ── honorifics: the built-in ones plus the couple's own ── */
  const [customTitles, setCustomTitles] = useState<string[]>(savedTitles);
  const titles = useMemo(() => guestTitleList(customTitles), [customTitles]);
  const [addingTitle, setAddingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  async function saveTitles(next: string[], successText: string) {
    const result = await send("/api/admin/wedding", {
      method: "PUT",
      body: JSON.stringify({ guestTitles: next }),
      successText,
    });
    if (result) setCustomTitles(next);
    return Boolean(result);
  }
  async function addTitle() {
    const title = newTitle.trim().replace(/\s+/g, " ");
    if (!title) return;
    if (titles.includes(title)) {
      setDraft((d) => ({ ...d, title }));
      setNewTitle("");
      setAddingTitle(false);
      return;
    }
    if (await saveTitles([...customTitles, title], t("បានបន្ថែមងារ"))) {
      setDraft((d) => ({ ...d, title }));
      setNewTitle("");
      setAddingTitle(false);
    }
  }
  const bulkPreview = useMemo(() => parseGuestLines(bulk, titles, bulkTitle), [bulk, titles, bulkTitle]);
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);

  /* ── the message that goes with each link ── */
  const [template, setTemplate] = useState(caption.template || DEFAULT_CAPTION);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const valuesFor = (g: Pick<Guest, "title" | "name" | "code">) => ({
    title: g.title,
    name: g.name,
    couple: caption.couple,
    date: caption.date,
    venue: caption.venue,
    address: caption.address,
    link: `${siteUrl}/invite/${g.code}`,
  });
  const sample = guests[0] ?? { title: "លោក", name: "ឈ្មោះភ្ញៀវ", code: "ABCD1234" };
  function insertToken(token: string) {
    const el = captionRef.current;
    if (!el) return setTemplate((cur) => cur + token);
    const { selectionStart: a, selectionEnd: b } = el;
    const next = template.slice(0, a) + token + template.slice(b);
    setTemplate(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + token.length, a + token.length);
    });
  }
  async function shareNative(g: Guest) {
    const v = valuesFor(g);
    try {
      await navigator.share({ text: captionWithoutLink(template, v), url: v.link });
    } catch {
      /* cancelled, or not available: nothing to do */
    }
  }
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

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

  async function copy(text: string, what = t("បានចម្លងតំណ")) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: "ok", text: what });
      setTimeout(() => setMessage(null), 2500);
    } catch {
      setMessage({ type: "error", text: t("មិនអាចចម្លងបានទេ") });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{t("ភ្ញៀវ & តំណអញ្ជើញ")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("ភ្ញៀវសរុប ")}{guests.length} {t(" នាក់")}</p>
        </div>
        <a
          href="/api/admin/export?type=guests"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          {t("ទាញយក CSV")}</a>
      </header>

      <StatusMessage message={message} />

      <Card
        title={t("សារភ្ជាប់ជាមួយតំណអញ្ជើញ")}
        description={t("សរសេរម្ដង ប្រព័ន្ធបំពេញឈ្មោះ និងតំណរបស់ភ្ញៀវម្នាក់ៗ · The message sent with each guest's link")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <Textarea
              ref={captionRef}
              rows={6}
              maxLength={1000}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              aria-label={t("សារភ្ជាប់ជាមួយតំណ")}
            />
            <div className="flex flex-wrap gap-1.5">
              {CAPTION_TOKENS.map((tok) => (
                <button
                  key={tok.token}
                  type="button"
                  onClick={() => insertToken(tok.token)}
                  className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-800 hover:bg-amber-100"
                  title={t(tok.label)}
                >
                  {tok.token} <span className="text-amber-600/80">{t(tok.label)}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() =>
                  send("/api/admin/wedding", {
                    method: "PUT",
                    // the default wording is stored as "" so a later improvement to it reaches this wedding too
                    body: JSON.stringify({ shareCaption: template.trim() === DEFAULT_CAPTION ? "" : template }),
                    successText: t("បានរក្សាទុកសារ"),
                  })
                }
              >
                {t("រក្សាទុកសារ")}</Button>
              <Button type="button" variant="ghost" onClick={() => setTemplate(DEFAULT_CAPTION)}>
                {t("ប្រើសារលំនាំដើម")}</Button>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">
              {t("ឧទាហរណ៍សម្រាប់ ")}{guestDisplayName(sample)}
            </p>
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 font-sans text-sm leading-relaxed text-slate-700">
              {renderCaption(template, valuesFor(sample))}
            </pre>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title={t("បន្ថែមភ្ញៀវម្នាក់")}
          description={t("ប្រព័ន្ធនឹងបង្កើតលេខកូដអញ្ជើញចៃដន្យដោយស្វ័យប្រវត្តិ")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ងារ")}>
              <div className="flex gap-2">
                <Select value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}>
                  {titles.map((title) => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                  <option value={NO_TITLE}>{t("— គ្មានងារ —")}</option>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 !px-3"
                  onClick={() => setAddingTitle((v) => !v)}
                  aria-expanded={addingTitle}
                  title={t("បន្ថែមងារថ្មី")}
                >
                  ＋
                </Button>
              </div>
            </Field>
            <Field label={t("ឈ្មោះ")}>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label={t("ឈ្មោះជាអក្សរឡាតាំង")} hint={t("ស្រេចចិត្ត — បង្ហាញនៅលើគម្រប")}>
              <Input
                value={draft.nameLatin}
                placeholder="Mr. Theng Rathrongroeung"
                onChange={(e) => setDraft({ ...draft, nameLatin: e.target.value })}
              />
            </Field>
            <Field label={t("ចំនួនកៅអី")}>
              <Input
                type="number"
                min={1}
                max={20}
                value={draft.allowedSeats}
                onChange={(e) => setDraft({ ...draft, allowedSeats: Number(e.target.value) })}
              />
            </Field>
            {addingTitle && (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 sm:col-span-2">
                <p className="text-sm font-medium text-slate-700">{t("ងារបន្ថែម")}</p>
                <div className="flex gap-2">
                  <Input
                    value={newTitle}
                    maxLength={40}
                    placeholder={t("ឧ. សម្ដេច, ឧកញ៉ា, បណ្ឌិត")}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTitle();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    className="shrink-0"
                    disabled={busy || !newTitle.trim() || customTitles.length >= MAX_CUSTOM_TITLES}
                    onClick={addTitle}
                  >
                    {t("បន្ថែម")}</Button>
                </div>
                {customTitles.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" role="list">
                    {customTitles.map((title) => (
                      <li key={title} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white py-0.5 pl-3 pr-1 text-sm text-slate-700">
                        {title}
                        <button
                          type="button"
                          className="rounded-full px-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`${t("លុបងារ")} ${title}`}
                          disabled={busy}
                          onClick={() => {
                            saveTitles(customTitles.filter((x) => x !== title), t("បានលុបងារ"));
                            if (draft.title === title) setDraft((d) => ({ ...d, title: DEFAULT_GUEST_TITLES[0] }));
                            if (bulkTitle === title) setBulkTitle(DEFAULT_GUEST_TITLES[0]);
                          }}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-slate-500">{t("ងារលំនាំដើម (")}{DEFAULT_GUEST_TITLES.length}{t(") មិនអាចលុបបាន · ភ្ញៀវដែលមានស្រាប់មិនប្រែប្រួល")}</p>
              </div>
            )}
            <div className="sm:col-span-2">
              <Field label={t("កំណត់ចំណាំ")}>
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
                  successText: t("បានបន្ថែមភ្ញៀវ"),
                });
                if (result)
                  setDraft({ title: draft.title, name: "", nameLatin: "", allowedSeats: 1, notes: "" });
              }}
            >
              {t("បន្ថែម")}</Button>
          </div>
        </Card>

        <Card
          title={t("នាំចូលភ្ញៀវច្រើននាក់")}
          description={t("មួយបន្ទាត់ក្នុងមួយនាក់៖ ងារ ឈ្មោះ, ចំនួនកៅអី — បន្ទាត់ដែលគ្មានងារ ប្រើងារដែលបានជ្រើសខាងក្រោម")}
        >
          <div className="mb-3 max-w-xs">
            <Field label={t("ងារលំនាំដើម (សម្រាប់បន្ទាត់ដែលគ្មានងារ)")}>
              <Select value={bulkTitle} onChange={(e) => setBulkTitle(e.target.value)}>
                {titles.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
                <option value={NO_TITLE}>{t("— គ្មានងារ —")}</option>
              </Select>
            </Field>
          </div>
          <Textarea
            rows={7}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"លោក ថេង រ័ត្នរង្សីរឿង, 2\nលោកស្រី ចាន់ ដារ៉ា, 1\nសុខ វណ្ណា, 1"}
          />
          {bulkPreview.length > 0 && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs text-slate-500">{t("នឹងនាំចូល ")}{bulkPreview.length} {t(" នាក់")}</p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm" role="list">
                {bulkPreview.map((g, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {g.title && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">{g.title}</span>}
                    <span className="min-w-0 flex-1 truncate text-slate-700">{g.name}</span>
                    <span className="shrink-0 text-xs text-slate-400">{g.seats} {t(" កៅអី")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              disabled={busy || !bulk.trim()}
              onClick={async () => {
                const result = await send("/api/admin/guests", {
                  method: "POST",
                  body: JSON.stringify({ text: bulk, title: bulkTitle }),
                  successText: t("បាននាំចូលភ្ញៀវ"),
                });
                if (result) setBulk("");
              }}
            >
              {t("នាំចូល")}</Button>
          </div>
        </Card>
      </div>

      <Card
        title={t("បញ្ជីភ្ញៀវ")}
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ស្វែងរកឈ្មោះ / កូដ")}
            className="w-full sm:w-64"
          />
          </div>
        }
      >
        <div className="space-y-3">
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{t("រកមិនឃើញភ្ញៀវទេ")}</p>}
          {filtered.map((guest) => {
            const link = `${siteUrl}/invite/${guest.code}`;
            const rsvp = rsvpByCode.get(guest.code);
            return (
              <div key={guest.id} className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {guestDisplayName(guest)}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {guest.allowedSeats} {t(" កៅអី · មើល ")}{guest.views} {t(" ដង")}</span>
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
                        {rsvp.attending ? `${t("ចូលរួម")} ${rsvp.guestCount} ${t("នាក់")}` : t("មិនអាចចូលរួម")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                        {t("មិនទាន់ឆ្លើយតប")}</span>
                    )}
                    <Button
                      variant="ghost"
                      type="button"
                      className={marks.done(guest, "message") ? DONE : ""}
                      aria-pressed={marks.done(guest, "message")}
                      onClick={() => {
                        marks.mark(guest, "message");
                        copy(renderCaption(template, valuesFor(guest)), t("បានចម្លងសារ និងតំណ"));
                      }}
                    >
                      {marks.done(guest, "message") && "✓ "}{t("ចម្លងសារ")}</Button>
                    <Button
                      variant="ghost"
                      type="button"
                      className={marks.done(guest, "link") ? DONE : ""}
                      aria-pressed={marks.done(guest, "link")}
                      onClick={() => {
                        marks.mark(guest, "link");
                        copy(link);
                      }}
                    >
                      {marks.done(guest, "link") && "✓ "}{t("ចម្លងតំណ")}</Button>
                    {canShare && (
                      <Button
                        variant="ghost"
                        type="button"
                        className={marks.done(guest, "share") ? DONE : ""}
                        aria-pressed={marks.done(guest, "share")}
                        onClick={() => {
                          marks.mark(guest, "share");
                          shareNative(guest);
                        }}
                      >
                        {marks.done(guest, "share") && "✓ "}{t("ចែករំលែក")}</Button>
                    )}
                    <Button
                      variant="ghost"
                      type="button"
                      className={marks.done(guest, "qr") ? DONE : ""}
                      aria-pressed={marks.done(guest, "qr")}
                      onClick={() => {
                        marks.mark(guest, "qr");
                        setQrGuest(guest);
                      }}
                    >
                      {marks.done(guest, "qr") && "✓ "}QR
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={busy}
                      className={marks.done(guest, "regen") ? DONE : ""}
                      title={t("បង្កើតលេខកូដថ្មី (តំណចាស់នឹងលែងដំណើរការ)")}
                      onClick={async () => {
                        const done = await send(`/api/admin/guests/${guest.id}`, {
                          method: "PUT",
                          body: JSON.stringify({ regenerateCode: true }),
                          successText: t("បានបង្កើតតំណថ្មី"),
                        });
                        if (done) marks.mark(guest, "regen");
                      }}
                    >
                      {marks.done(guest, "regen") && "✓ "}{t("កូដថ្មី")}</Button>
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(captionWithoutLink(template, valuesFor(guest)))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => marks.mark(guest, "telegram")}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        marks.done(guest, "telegram")
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {marks.done(guest, "telegram") && "✓ "}Telegram
                    </a>
                    <Button
                      variant="danger"
                      type="button"
                      disabled={busy}
                      onClick={() => send(`/api/admin/guests/${guest.id}`, { method: "DELETE", successText: t("បានលុប") })}
                    >
                      {t("លុប")}</Button>
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
              {t("QR Code សម្រាប់អញ្ជើញភ្ញៀវ")}</p>
            <p className="mt-1 text-xs text-slate-500">{guestDisplayName(qrGuest)}</p>
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
                {t("ទាញយក PNG")}</a>
              <Button variant="ghost" type="button" onClick={() => setQrGuest(null)}>{t("បិទ")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

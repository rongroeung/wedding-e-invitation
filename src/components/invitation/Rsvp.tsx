"use client";

import { useState } from "react";
import type { Guest, Rsvp as RsvpRecord } from "@/lib/db/schema";
import { toKhmerNumber } from "@/lib/khmer";
import { SectionTitle } from "@/components/ui/SectionTitle";

/** What the guest has already told us, if anything. */
export type RsvpReply = Pick<RsvpRecord, "name" | "attending" | "guestCount" | "message">;

/**
 * សូមមេត្តាចូលរួមបញ្ជាក់វត្តមាន — the RSVP section.
 *
 * A guest who has already answered is thanked rather than asked again, and the
 * thank-you survives a reload: the reply is read from the database on the
 * server and passed in, so returning to the invitation shows the confirmation,
 * not an empty form. The wording differs for a guest who is coming and one who
 * has sent regrets, and either can reopen the form to change their answer.
 */
export function Rsvp({
  guest,
  reply = null,
  onSubmitted,
}: {
  guest: Guest | null;
  /** The guest's stored reply, or null if they have not answered. */
  reply?: RsvpReply | null;
  onSubmitted?: (attending: boolean) => void;
}) {
  const [saved, setSaved] = useState<RsvpReply | null>(reply);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(
    reply?.name || (guest ? `${guest.title} ${guest.name}` : ""),
  );
  const [attending, setAttending] = useState(reply ? reply.attending : true);
  const [guestCount, setGuestCount] = useState(
    reply?.guestCount || guest?.allowedSeats || 1,
  );
  const [message, setMessage] = useState(reply?.message ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("សូមមេត្តាបញ្ចូលឈ្មោះរបស់លោកអ្នក");
      return;
    }
    setStatus("sending");
    setError("");
    const payload = {
      name: name.trim(),
      attending,
      guestCount: attending ? Number(guestCount) || 1 : 0,
      message: message.trim(),
    };
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, guestCode: guest?.code ?? "" }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || "មិនអាចផ្ញើបានទេ");
      setSaved(payload);
      setEditing(false);
      setStatus("idle");
      onSubmitted?.(attending);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្ដងទៀត");
    }
  }

  const confirmed = saved && !editing;

  return (
    <section id="rsvp" className="section-pad relative">
      <div className="mx-auto max-w-2xl">
        <SectionTitle
          eyebrow="បញ្ជាក់វត្តមាន"
          title={confirmed ? "សូមអរគុណ" : "សូមមេត្តាចូលរួមបញ្ជាក់វត្តមាន"}
          subtitle={
            confirmed
              ? "យើងខ្ញុំបានទទួលការឆ្លើយតបរបស់លោកអ្នករួចរាល់ហើយ។"
              : "ដើម្បីឱ្យយើងខ្ញុំអាចរៀបចំទទួលស្វាគមន៍លោកអ្នកបានយ៉ាងប្រសើរ សូមមេត្តាបញ្ជាក់វត្តមានរបស់លោកអ្នក។"
          }
        />

        <div className="reveal card-panel gold-border relative overflow-hidden rounded-[22px] px-5 py-9 sm:px-8">
          {confirmed ? (
            <div className="relative py-4 text-center">
              <p className="mx-auto max-w-md text-base leading-loose text-heading khmer-wrap">
                {saved.attending ? (
                  <>
                    សូមអរគុណសម្រាប់ការបញ្ជាក់វត្តមាន។ យើងខ្ញុំរីករាយ
                    និងទន្ទឹងរង់ចាំទទួលស្វាគមន៍លោកអ្នក ក្នុងថ្ងៃដ៏សិរីមង្គលនេះ។
                  </>
                ) : (
                  <>
                    សូមអរគុណសម្រាប់ការឆ្លើយតប។ យើងខ្ញុំយល់ព្រម
                    ហើយសូមរក្សាទុកនូវសេចក្ដីរីករាយនេះជាមួយលោកអ្នក
                    ទោះបីមិនអាចជួបគ្នាក្នុងថ្ងៃនោះក៏ដោយ។
                  </>
                )}
              </p>

              {/* What we recorded, so the guest can see it is right */}
              <dl className="mx-auto mt-8 max-w-sm space-y-2.5 rounded-2xl bg-champagne/25 px-5 py-5 text-left">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-xs text-ink/70 khmer-wrap">ឈ្មោះ</dt>
                  <dd className="text-sm text-heading khmer-wrap">{saved.name}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-xs text-ink/70 khmer-wrap">វត្តមាន</dt>
                  <dd className="text-sm text-heading khmer-wrap">
                    {saved.attending ? "ចូលរួម" : "មិនអាចចូលរួម"}
                  </dd>
                </div>
                {saved.attending && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-xs text-ink/70 khmer-wrap">ចំនួនភ្ញៀវ</dt>
                    <dd className="text-sm text-heading khmer-wrap">
                      {toKhmerNumber(saved.guestCount)} នាក់
                    </dd>
                  </div>
                )}
                {saved.message && (
                  <div className="border-t border-gold/25 pt-2.5">
                    <dt className="text-xs text-ink/70 khmer-wrap">សារជូនពរ</dt>
                    <dd className="mt-1 text-sm leading-loose text-heading khmer-wrap">
                      {saved.message}
                    </dd>
                  </div>
                )}
              </dl>

              <button type="button" className="btn-outline mt-8" onClick={() => setEditing(true)}>
                កែប្រែចម្លើយ
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="relative space-y-5">
              <div>
                <label className="label" htmlFor="rsvp-name">ឈ្មោះ</label>
                <input
                  id="rsvp-name"
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="សូមបញ្ចូលឈ្មោះរបស់លោកអ្នក"
                  maxLength={120}
                  required
                />
              </div>

              <fieldset>
                <legend className="label">តើលោកអ្នកអាចចូលរួមបានទេ?</legend>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: true, label: "ចូលរួម", icon: "✓" },
                    { value: false, label: "មិនអាចចូលរួម", icon: "✕" },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => setAttending(option.value)}
                      className={`rounded-xl border px-4 py-3 text-sm transition-all duration-300 khmer-wrap ${
                        attending === option.value
                          ? "border-gold bg-champagne/30 text-heading shadow-gold"
                          : "border-gold/40 bg-white/60 text-ink/75"
                      }`}
                      aria-pressed={attending === option.value}
                    >
                      <span className="mr-2" aria-hidden="true">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {attending && (
                <div>
                  <label className="label" htmlFor="rsvp-count">ចំនួនភ្ញៀវ</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="btn-outline h-11 w-11 !px-0 text-lg"
                      onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                      aria-label="បន្ថយ"
                    >
                      −
                    </button>
                    <input
                      id="rsvp-count"
                      className="field text-center"
                      type="number"
                      min={1}
                      max={20}
                      value={guestCount}
                      onChange={(e) => setGuestCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                    />
                    <button
                      type="button"
                      className="btn-outline h-11 w-11 !px-0 text-lg"
                      onClick={() => setGuestCount((c) => Math.min(20, c + 1))}
                      aria-label="បន្ថែម"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-ink/72 khmer-wrap">
                    ចំនួន {toKhmerNumber(guestCount)} នាក់
                    {guest ? ` (កៅអីដែលបានរៀបចំ៖ ${toKhmerNumber(guest.allowedSeats)})` : ""}
                  </p>
                </div>
              )}

              <div>
                <label className="label" htmlFor="rsvp-message">សារជូនពរ</label>
                <textarea
                  id="rsvp-message"
                  className="field min-h-[110px] resize-y"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="សូមជូនពរដល់គូស្វាមីភរិយាថ្មី"
                  maxLength={600}
                />
              </div>

              {error && (
                <p className="rounded-xl bg-heading/10 px-4 py-3 text-sm text-heading khmer-wrap">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <button type="submit" className="btn-gold w-full" disabled={status === "sending"}>
                  {status === "sending" ? "កំពុងផ្ញើ..." : "បញ្ជាក់វត្តមាន"}
                </button>
                {saved && (
                  <button
                    type="button"
                    className="btn-outline w-full sm:w-auto sm:shrink-0"
                    onClick={() => {
                      setEditing(false);
                      setName(saved.name);
                      setAttending(saved.attending);
                      setGuestCount(saved.guestCount || 1);
                      setMessage(saved.message);
                      setError("");
                    }}
                  >
                    បោះបង់
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

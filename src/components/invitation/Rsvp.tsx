"use client";

import { useState } from "react";
import type { Guest } from "@/lib/db/schema";
import { toKhmerNumber } from "@/lib/khmer";
import { GoldDivider, Lotus } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/** សូមមេត្តាចូលរួមបញ្ជាក់វត្តមាន — RSVP form. */
export function Rsvp({
  guest,
  onSubmitted,
}: {
  guest: Guest | null;
  onSubmitted?: (attending: boolean) => void;
}) {
  const [name, setName] = useState(guest ? `${guest.title} ${guest.name}` : "");
  const [phone, setPhone] = useState("");
  const [attending, setAttending] = useState(true);
  const [guestCount, setGuestCount] = useState(guest?.allowedSeats ?? 1);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("សូមមេត្តាបញ្ចូលឈ្មោះរបស់លោកអ្នក");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          attending,
          guestCount: attending ? Number(guestCount) || 1 : 0,
          message: message.trim(),
          guestCode: guest?.code ?? "",
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "មិនអាចផ្ញើបានទេ");
      setStatus("done");
      onSubmitted?.(attending);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្ដងទៀត");
    }
  }

  return (
    <section id="rsvp" className="section-pad relative">
      <div className="mx-auto max-w-2xl">
        <SectionTitle
          eyebrow="បញ្ជាក់វត្តមាន"
          title="សូមមេត្តាចូលរួមបញ្ជាក់វត្តមាន"
          subtitle="ដើម្បីឱ្យយើងខ្ញុំអាចរៀបចំទទួលស្វាគមន៍លោកអ្នកបានយ៉ាងប្រសើរ សូមមេត្តាបញ្ជាក់វត្តមានរបស់លោកអ្នក។"
        />

        <div className="reveal card-panel gold-border relative overflow-hidden rounded-[22px] px-5 py-9 sm:px-8">

          {status === "done" ? (
            <div className="relative py-8 text-center">
              <Lotus className="mx-auto h-10 w-10 animate-floaty text-gold-dark" />
              <GoldDivider className="my-6" width="max-w-[150px]" />
              <p className="mx-auto max-w-md text-sm leading-loose text-heading khmer-wrap sm:text-base">
                សូមអរគុណសម្រាប់ការបញ្ជាក់វត្តមាន។ យើងខ្ញុំរីករាយ និងទន្ទឹងរង់ចាំទទួលស្វាគមន៍លោកអ្នក
                ក្នុងថ្ងៃដ៏សិរីមង្គលនេះ។ ❤️
              </p>
              <button
                type="button"
                className="btn-outline mt-8"
                onClick={() => { setStatus("idle"); setMessage(""); }}
              >
                បញ្ជាក់វត្តមានម្ដងទៀត
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

              <div>
                <label className="label" htmlFor="rsvp-phone">លេខទូរស័ព្ទ</label>
                <input
                  id="rsvp-phone"
                  className="field"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="០១២ ៣៤៥ ៦៧៨"
                  maxLength={40}
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

              <button type="submit" className="btn-gold w-full" disabled={status === "sending"}>
                {status === "sending" ? "កំពុងផ្ញើ..." : "បញ្ជាក់វត្តមាន"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

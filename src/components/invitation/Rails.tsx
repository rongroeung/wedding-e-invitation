"use client";

import type { Guest, Wedding } from "@/lib/db/schema";
import { formatLatinDate } from "@/lib/khmer";

/* ── Left rail: the two facts a guest looks up again and again ─────────── */

export function EventDetailsRail({ wedding }: { wedding: Wedding }) {
  return (
    <section>
      {/*
        * Centred, on one axis, to match the "Controls" heading in the opposite
        * rail — the two frame the invitation and any disagreement between them
        * reads as one of the pair being wrong rather than as variety.
        *
        * `text-center` on the header centres the subtitle, and the mark travels
        * inside the `h2`'s own centred flex row rather than sitting outside it,
        * so the pair is centred as a unit exactly as the other rail's is.
        *
        * `items-baseline`, and the mark is drawn on its box's own centre line
        * (see `SparkleIcon`), so it sits on the heading's baseline the way a
        * piece of punctuation would.
        */}
      <header className="mb-5 border-b border-gold-frame/30 pb-4 text-center">
        <h2 className="flex items-baseline justify-center gap-2 text-lg font-semibold leading-tight text-heading">
          <SparkleIcon /> Event Details
        </h2>
        <p className="mt-1 text-xs leading-tight text-ink/70">Wedding Celebration</p>
      </header>

      <div className="space-y-3">
        <RailCard icon={<CalendarIcon />} label="DATE">
          {formatLatinDate(new Date(wedding.weddingDate))}
        </RailCard>
        <RailCard icon={<PinIcon />} label="VENUE">
          <span className="khmer-wrap">{wedding.venueName}</span>
          {wedding.venueAddress && (
            <span className="mt-1 block text-xs font-normal text-ink/70 khmer-wrap">
              {wedding.venueAddress}
            </span>
          )}
        </RailCard>
      </div>
    </section>
  );
}

function RailCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/70 p-4 shadow-sm ring-1 ring-gold-frame/20">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-heading text-cream">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.65rem] font-medium tracking-wider text-ink/60">{label}</span>
        <span className="mt-0.5 block text-sm font-medium leading-relaxed text-heading">{children}</span>
      </span>
    </div>
  );
}

/* ── Right rail: controls, the guest's own QR, RSVP state ──────────────── */

export function ControlsRail({
  guest,
  rsvpStatus,
  music,
}: {
  guest: Guest | null;
  rsvpStatus: "attending" | "declined" | "pending";
  music?: React.ReactNode;
}) {
  const status = {
    attending: { label: "ចូលរួម", tone: "bg-emerald-100 text-emerald-800" },
    declined: { label: "មិនអាចចូលរួម", tone: "bg-rose-100 text-rose-800" },
    pending: { label: "Pending", tone: "bg-amber-100 text-amber-800" },
  }[rsvpStatus];

  return (
    <section>
      <header className="mb-5 border-b border-gold-frame/30 pb-4 text-center">
        <h2 className="flex items-center justify-center gap-2 text-lg font-semibold text-heading">
          <QrGlyph /> Controls
        </h2>
      </header>

      {music && <div className="mb-5 flex justify-center">{music}</div>}

      {guest && (
        <div className="rounded-2xl bg-brown p-5 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-cream">
            <QrGlyph /> Guest QR Code
          </p>
          <div className="mx-auto mt-4 w-fit rounded-lg bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr?code=${encodeURIComponent(guest.code)}`}
              alt="QR Code សម្រាប់សំបុត្រអញ្ជើញ"
              width={168}
              height={168}
              className="h-[168px] w-[168px]"
            />
          </div>
          <p className="mx-auto mt-3 max-w-[15rem] text-xs leading-relaxed text-cream/70">
            ស្កេន QR នេះដើម្បីបើកនៅលើទូរស័ព្ទ
          </p>
          <p className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm text-cream khmer-wrap">
            {guest.nameLatin?.trim() || `${guest.title} ${guest.name}`}
          </p>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-heading">
          <PersonIcon /> Guest Information
        </p>
        <div className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-gold-frame/20">
          <span className="text-sm text-ink/80">RSVP Status</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium khmer-wrap ${status.tone}`}>
            {status.label}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────── */

/**
 * The mark beside "Event Details".
 *
 * Redrawn so the large star sits on the box's own centre line and the small
 * one rides above it to the right. It was the other way round — the big star
 * high in the box and the small one low — which put the glyph's visual weight
 * well above the middle of its own square, so every attempt to align it with
 * the heading beside it was aligning the wrong thing. A mark whose ink is
 * off-centre inside its box cannot be centred by layout; it has to be redrawn.
 *
 * `shrink-0` because it lives in a flex row next to text that can wrap: without
 * it a narrow rail squeezes the star into an oval.
 */
function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.15rem] w-[1.15rem] shrink-0 translate-y-[0.14rem] text-gold-frame"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 4.4l1.95 5.65L17.6 12l-5.65 1.95L10 19.6l-1.95-5.65L2.4 12l5.65-1.95L10 4.4Z" />
      <path
        d="M18.7 2.2l.86 2.44 2.44.86-2.44.86-.86 2.44-.86-2.44-2.44-.86 2.44-.86.86-2.44Z"
        opacity=".62"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold-frame" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" strokeLinecap="round" />
    </svg>
  );
}

function QrGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold-frame" fill="currentColor" aria-hidden="true">
      <path d="M3 3h7v7H3V3Zm2 2v3h3V5H5Zm9-2h7v7h-7V3Zm2 2v3h3V5h-3ZM3 14h7v7H3v-7Zm2 2v3h3v-3H5Zm9-2h3v3h-3v-3Zm5 0h2v2h-2v-2Zm-5 5h3v2h-3v-2Zm5 0h2v2h-2v-2Z" />
    </svg>
  );
}

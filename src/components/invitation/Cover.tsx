"use client";

import type { Guest, Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import {
  EnvelopeIcon,
  GoldDivider,
  Lotus,
  OrnateFrame,
  PatternBackground,
} from "@/components/ui/Ornaments";
import { PetalFall } from "./PetalFall";

/**
 * Full-screen “envelope” cover. Stays on top of the invitation until the guest
 * taps បើកសំបុត្រអញ្ជើញ, mirroring the act of opening a physical wedding card.
 */
export function Cover({
  wedding,
  guest,
  opened,
  onOpen,
}: {
  wedding: Wedding;
  guest: Guest | null;
  opened: boolean;
  onOpen: () => void;
}) {
  const photo = mediaSrc(wedding.coverPhotoId, wedding.coverPhotoUrl);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-all duration-[1100ms] ease-[cubic-bezier(.72,0,.28,1)] ${
        opened ? "pointer-events-none -translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      }`}
      aria-hidden={opened}
    >
      {/* Background */}
      <div className="paper absolute inset-0" />
      {photo && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt=""
            className="h-full w-full scale-105 object-cover opacity-25 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ivory/80 via-ivory/70 to-ivory/90" />
        </div>
      )}
      <PatternBackground pattern={wedding.pattern} />
      <PetalFall count={7} />

      {/* Card */}
      <div className="relative z-10 mx-4 w-full max-w-lg animate-scaleIn">
        <div className="card-panel gold-border relative overflow-hidden rounded-[28px] px-6 py-12 text-center sm:px-10 sm:py-14">
          <OrnateFrame />

          <div className="relative">
            <Lotus className="mx-auto h-9 w-9 animate-floaty text-gold" />

            <p className="mt-5 text-[0.7rem] text-gold-deep/85 sm:text-xs">
              {wedding.subtitle}
            </p>

            {guest && (
              <p className="mt-3 text-base text-burgundy khmer-wrap sm:text-lg">
                {guest.title} {guest.name}
              </p>
            )}

            <h1 className="gold-text mt-4 text-[1.7rem] leading-[1.9] khmer-wrap sm:text-4xl">
              {wedding.title}
            </h1>

            <GoldDivider className="my-7" width="max-w-[180px]" />

            <div className="space-y-2">
              <p className="text-xl text-burgundy khmer-wrap sm:text-2xl">
                <span className="text-ink/60 text-base sm:text-lg">{wedding.groomTitle} </span>
                {wedding.groomName}
              </p>
              <p className="font-latin text-sm italic text-gold-deep/80">និង</p>
              <p className="text-xl text-burgundy khmer-wrap sm:text-2xl">
                <span className="text-ink/60 text-base sm:text-lg">{wedding.brideTitle} </span>
                {wedding.brideName}
              </p>
            </div>

            <GoldDivider className="my-7" width="max-w-[180px]" icon="diamond" />

            <p className="text-sm leading-loose text-ink/80 khmer-wrap sm:text-base">
              {wedding.weddingDateKhmer}
            </p>
            <p className="mt-1 text-xs text-ink/60 khmer-wrap sm:text-sm">{wedding.venueName}</p>

            <button type="button" onClick={onOpen} className="btn-gold mt-9">
              <EnvelopeIcon />
              <span>{wedding.openButton}</span>
            </button>

            <p className="mt-5 text-[0.65rem] text-ink/45">
              សូមចុចដើម្បីបើកសំបុត្រ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { GoldDivider } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * ចំណងដៃ — one KHQR.
 *
 * KHQR is Cambodia's unified QR standard, so a single code is scannable from
 * every bank and wallet app in the country. Listing separate account numbers
 * per bank asks the guest to work out which one applies to them; one code does
 * not.
 */
export function Gift({ wedding }: { wedding: Wedding }) {
  const qr = mediaSrc(wedding.giftQrMediaId, wedding.giftQrUrl);
  if (!wedding.giftEnabled || !qr) return null;

  return (
    <section id="gift" className="section-pad relative">
      <div className="mx-auto max-w-md">
        <SectionTitle eyebrow="ចំណងដៃ" title="ចំណងដៃ" subtitle={wedding.giftIntro} />

        <p className="reveal mx-auto mb-8 max-w-sm text-center text-[0.85rem] leading-loose text-ink/80 khmer-wrap">
          {wedding.giftNote}
        </p>

        <div className="reveal card-panel gold-border mx-auto max-w-[19rem] rounded-2xl px-5 py-7 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="KHQR"
            loading="lazy"
            className="mx-auto w-full max-w-[15rem] rounded-xl bg-white"
          />

          {wedding.giftAccountName && (
            <>
              <GoldDivider className="my-4" width="max-w-[110px]" icon="none" />
              <p className="text-sm font-medium tracking-wide text-heading">
                {wedding.giftAccountName}
              </p>
            </>
          )}

          <p className="mt-3 text-xs text-ink/75 khmer-wrap">
            ស្កេនដោយកម្មវិធីធនាគារណាមួយ
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import type { GiftAccount, Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { GoldDivider } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/** ចំណងដៃ — optional digital gift section. */
export function Gift({ wedding, accounts }: { wedding: Wedding; accounts: GiftAccount[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!wedding.giftEnabled || accounts.length === 0) return null;

  async function copy(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ""));
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable (older in-app browsers) — ignore silently */
    }
  }

  return (
    <section id="gift" className="section-pad relative">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="ចំណងដៃ" title="ចំណងដៃ" subtitle={wedding.giftIntro} />

        <p className="reveal mx-auto mb-8 max-w-xl text-center text-sm leading-loose text-ink/70 khmer-wrap sm:text-base">
          {wedding.giftNote}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => {
            const qr = mediaSrc(account.qrMediaId, account.qrUrl);
            return (
              <div
                key={account.id}
                className="reveal card-panel gold-border rounded-2xl px-5 py-6 text-center"
              >
                <p className="gold-text text-base sm:text-lg">{account.bankName}</p>
                <GoldDivider className="my-4" width="max-w-[110px]" icon="none" />
                <p className="text-sm text-ink/75 khmer-wrap">{account.accountName}</p>
                <p className="mt-1 font-latin text-lg tracking-wide text-burgundy">
                  {account.accountNumber}
                </p>
                {account.note && (
                  <p className="mt-2 text-xs text-ink/55 khmer-wrap">{account.note}</p>
                )}

                {qr && (
                  <div className="mt-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qr}
                      alt={`QR Code ${account.bankName}`}
                      loading="lazy"
                      className="mx-auto h-40 w-40 rounded-xl bg-white p-2 shadow-card"
                    />
                    <p className="mt-2 text-xs text-ink/55 khmer-wrap">ស្កេន QR Code</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => copy(account.accountNumber, account.id)}
                  className="btn-outline mt-5 text-xs"
                >
                  {copied === account.id ? "បានចម្លងរួច ✓" : "ចម្លងលេខគណនី"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

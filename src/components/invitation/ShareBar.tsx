"use client";

import { useState } from "react";
import { GoldDivider } from "@/components/ui/Ornaments";

/** Telegram / Facebook / Messenger / copy-link sharing. */
export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function currentUrl() {
    return typeof window === "undefined" ? "" : window.location.href;
  }

  const share = (target: "telegram" | "facebook" | "messenger") => {
    const url = encodeURIComponent(currentUrl());
    const text = encodeURIComponent(title);
    const links = {
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      messenger: `https://www.facebook.com/dialog/send?link=${url}&app_id=291494419107518&redirect_uri=${url}`,
    };
    window.open(links[target], "_blank", "noopener,noreferrer,width=640,height=640");
  };

  async function copyLink() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: currentUrl() });
        return;
      }
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user dismissed the share sheet */
    }
  }

  const buttons = [
    { key: "telegram", label: "Telegram", icon: "✈️", onClick: () => share("telegram") },
    { key: "facebook", label: "Facebook", icon: "📘", onClick: () => share("facebook") },
    { key: "messenger", label: "Messenger", icon: "💬", onClick: () => share("messenger") },
    { key: "copy", label: copied ? "បានចម្លង ✓" : "ចម្លងតំណ", icon: "🔗", onClick: copyLink },
  ];

  return (
    <section className="section-pad relative !py-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="reveal text-sm text-gold-deep">
          ចែករំលែកសំបុត្រអញ្ជើញនេះ
        </p>
        <GoldDivider className="my-5" width="max-w-[140px]" icon="none" />
        <div className="reveal flex flex-wrap items-center justify-center gap-3">
          {buttons.map((button) => (
            <button
              key={button.key}
              type="button"
              onClick={button.onClick}
              className="btn-outline text-sm"
            >
              <span aria-hidden="true">{button.icon}</span>
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

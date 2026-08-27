"use client";

import { useEffect, useState } from "react";
import { COUNTDOWN_LABELS, toKhmerNumber2 } from "@/lib/khmer";
import { GoldDivider } from "@/components/ui/Ornaments";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function remainingFrom(target: number): Remaining | null {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/** Live countdown to the wedding day, rendered in Khmer numerals. */
export function Countdown({ date }: { date: string }) {
  const target = new Date(date).getTime();
  const [remaining, setRemaining] = useState<Remaining | null | undefined>(undefined);

  useEffect(() => {
    setRemaining(remainingFrom(target));
    const timer = setInterval(() => setRemaining(remainingFrom(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  // Not yet hydrated — render a stable placeholder to avoid layout shift.
  const cells: [keyof typeof COUNTDOWN_LABELS, number][] = [
    ["days", remaining?.days ?? 0],
    ["hours", remaining?.hours ?? 0],
    ["minutes", remaining?.minutes ?? 0],
    ["seconds", remaining?.seconds ?? 0],
  ];

  if (remaining === null) {
    return (
      <div className="reveal mt-10 text-center">
        <p className="gold-text text-xl leading-loose khmer-wrap sm:text-2xl">
          សូមអបអរសាទរដល់គូស្វាមីភរិយាថ្មី! ❤️
        </p>
      </div>
    );
  }

  return (
    <div className="reveal mt-10">
      <p className="text-center text-xs text-gold-deep/85 sm:text-sm">
        រាប់ថយក្រោយដល់ថ្ងៃមង្គលការ
      </p>
      <GoldDivider className="my-5" width="max-w-[150px]" icon="none" />

      <div className="mx-auto grid max-w-md grid-cols-4 gap-2 sm:gap-4">
        {cells.map(([key, value]) => (
          <div
            key={key}
            className="card-panel gold-border rounded-2xl px-1 py-4 text-center sm:py-5"
          >
            <div
              className="gold-text text-2xl tabular-nums sm:text-4xl"
              suppressHydrationWarning
            >
              {toKhmerNumber2(value)}
            </div>
            <div className="mt-1 text-[0.65rem] text-ink/60 sm:text-xs">
              {COUNTDOWN_LABELS[key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

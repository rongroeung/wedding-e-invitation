"use client";

import { useEffect, useState } from "react";

type Mote = {
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

/**
 * The card is never quite still: gold motes drift upward, a pool of
 * candlelight breathes behind the content, and a slow sheen crosses the paper.
 *
 * Everything is generated on the client (so the server HTML stays stable) and
 * skipped entirely for guests who prefer reduced motion.
 */
export function LiveBackdrop({
  count = 12,
  glow = true,
  sheen = true,
}: {
  count?: number;
  glow?: boolean;
  sheen?: boolean;
}) {
  const [motes, setMotes] = useState<Mote[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setMotes(
      Array.from({ length: Math.min(count, 16) }, () => ({
        left: Math.random() * 100,
        size: 3 + Math.random() * 7,
        delay: -Math.random() * 26,
        duration: 20 + Math.random() * 20,
        opacity: 0.3 + Math.random() * 0.45,
      })),
    );
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {glow && (
        <span
          className="candle-glow"
          style={{ top: "8%", height: "46%", width: "78%" }}
        />
      )}

      {motes.map((mote, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: `${mote.left}%`,
            bottom: "-6vh",
            width: mote.size,
            height: mote.size,
            opacity: mote.opacity,
            animationDelay: `${mote.delay}s`,
            animationDuration: `${mote.duration}s`,
          }}
        />
      ))}

      {sheen && motes.length > 0 && <span className="paper-sheen" />}
    </div>
  );
}

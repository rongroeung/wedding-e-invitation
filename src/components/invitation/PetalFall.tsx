"use client";

import { useEffect, useState } from "react";

/**
 * A handful of slowly falling lotus petals. Rendered client-side only, capped
 * at 10 elements, and disabled entirely for users who prefer reduced motion.
 */
export function PetalFall({ count = 9 }: { count?: number }) {
  const [petals, setPetals] = useState<
    { left: number; delay: number; duration: number; size: number; opacity: number }[]
  >([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPetals(
      Array.from({ length: Math.min(count, 10) }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 14,
        duration: 16 + Math.random() * 14,
        size: 10 + Math.random() * 14,
        opacity: 0.25 + Math.random() * 0.35,
      })),
    );
  }, [count]);

  if (petals.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {petals.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="petal text-champagne"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
          fill="currentColor"
        >
          <path d="M12 2c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z" />
        </svg>
      ))}
    </div>
  );
}

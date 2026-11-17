"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * The guest's name on the envelope set, on the carved-gold Khmer name plate
 * the couple supplied (public/frames/kbach-name-frame.webp: one frame cut
 * from their own artwork, with a twisted-scroll border, pointed ends and a
 * crest at the middle of each long edge, around a red velvet panel).
 *
 * The plate is shown whole, at its own proportions, and never stretched; the
 * name is fitted to the panel instead. It stays on one line and is scaled
 * down, only as far as it must be, when it is longer than the panel is wide.
 */

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function KbachNameFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  const body = useRef<HTMLDivElement>(null);

  useIso(() => {
    const el = body.current;
    if (!el) return;
    const fit = () => {
      const inner = el.firstElementChild as HTMLElement | null;
      if (!inner) return;
      // the name's natural size (a transform does not change these)
      const w = inner.scrollWidth;
      const h = inner.offsetHeight;
      const s = Math.min(1, el.clientWidth / Math.max(1, w), el.clientHeight / Math.max(1, h));
      el.style.setProperty("--knf-fit", s.toFixed(3));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    // the Khmer and Muol faces may arrive after the first measurement
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`knf ${className}`}>
      <div ref={body} className="knf-body">
        {children}
      </div>
    </div>
  );
}

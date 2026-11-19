"use client";

import { useEffect, useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Lines that must stay on one line — a guest's name, a date, the parents'
 * names — set a little smaller on a narrow phone instead of breaking.
 *
 * `FitGroup` measures every `Fit` inside it and gives them all ONE scale, the
 * one the tightest needs, so lines that belong together (the four parents'
 * names, say) keep the same size. Nothing grows past its designed size, and a
 * line is never squeezed below `min` of it: past that it wraps after all,
 * which beats unreadable type.
 */
export function FitGroup({
  as: Tag = "div",
  className,
  min = 0.6,
  zoom = false,
  children,
}: {
  as?: ElementType;
  className?: string;
  min?: number;
  /**
   * Scale everything in the group — every line, gap and margin — by the one
   * factor, not just the `Fit` lines (CSS `zoom`). For a block of text whose
   * lines must keep their proportions to each other, like the letter: shrink
   * only the long lines and they end up smaller than the short ones.
   */
  zoom?: boolean;
  children: ReactNode;
}) {
  const box = useRef<HTMLElement>(null);

  useIso(() => {
    const el = box.current;
    if (!el) return;
    let frame = 0;
    const fit = () => {
      const cells = Array.from(el.querySelectorAll<HTMLElement>("[data-fit]"));
      if (!cells.length) return;
      // measure on one line and at full size, whatever the last pass decided
      el.removeAttribute("data-fit-wrap");
      if (zoom) el.style.removeProperty("zoom");
      const current = zoom ? 1 : parseFloat(el.style.getPropertyValue("--fit")) || 1;
      let scale = 1;
      for (const cell of cells) {
        const inner = cell.firstElementChild as HTMLElement | null;
        if (!inner) continue;
        const natural = inner.getBoundingClientRect().width / current;
        const room = cell.clientWidth;
        if (natural > 0 && room > 0) scale = Math.min(scale, room / natural);
      }
      const wraps = scale < min;
      // a hair under the exact fit, so rounding never tips a line over
      const fitted = scale >= 1 ? "1" : Math.max(min, scale * 0.995).toFixed(3);
      if (zoom) {
        // the whole block at one scale; the lines themselves stay at full size
        if (Number(fitted) < 1) el.style.setProperty("zoom", fitted);
        el.setAttribute("data-fit-zoom", fitted);
      } else {
        el.style.setProperty("--fit", fitted);
      }
      el.toggleAttribute("data-fit-wrap", wraps);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    fit();
    // only a change of width can change the fit (the zoom itself changes the
    // height, and must not set off another round)
    let width = el.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (Math.abs(w - width) < 0.5) return;
      width = w;
      schedule();
    });
    ro.observe(el);
    document.fonts?.ready.then(schedule).catch(() => {});
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [min, zoom]);

  return (
    <Tag ref={box} className={`fit-group ${className ?? ""}`}>
      {children}
    </Tag>
  );
}

/** One line in a `FitGroup`. */
export function Fit({
  as: Tag = "p",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag data-fit="" className={`fit-cell ${className ?? ""}`}>
      <span className="fit-inner">{children}</span>
    </Tag>
  );
}

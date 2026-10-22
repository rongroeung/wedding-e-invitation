"use client";

import { useSyncExternalStore } from "react";

import {
  type Appearance,
  type FxLevel,
  type FxMode,
  type PaperTheme,
  STORAGE_KEY,
  isDarkSheet,
  isFx,
  isLevel,
  isPaper,
  isTone,
} from "@/lib/appearance";

/**
 * The guest's appearance choice, live.
 *
 * The truth is the three attributes on `<html>` (set before paint by the boot
 * script); this reads and writes them, mirrors an explicit choice into
 * `localStorage`, and tells subscribers. Storage is best-effort: if it throws,
 * the choice still applies for this visit and the page carries on.
 */

const listeners = new Set<() => void>();

function attrs(): Appearance {
  const h = document.documentElement;
  const paper = h.getAttribute("data-paper-theme");
  const fx = h.getAttribute("data-fx");
  const level = h.getAttribute("data-fx-level");
  const tone = h.getAttribute("data-paper-tone");
  return {
    paper: (isPaper(paper) ? paper : "classic-ivory") as PaperTheme,
    tone: isTone(tone) ? tone : "design",
    fx: (isFx(fx) ? fx : "none") as FxMode,
    level: (isLevel(level) ? level : "medium") as FxLevel,
  };
}

function apply(a: Appearance) {
  const h = document.documentElement;
  h.setAttribute("data-paper-theme", a.paper);
  if (a.tone && a.tone !== "design") h.setAttribute("data-paper-tone", a.tone);
  else h.removeAttribute("data-paper-tone");
  if (isDarkSheet(a.paper, a.tone)) h.setAttribute("data-paper-dark", "");
  else h.removeAttribute("data-paper-dark");
  h.setAttribute("data-fx", a.fx);
  h.setAttribute("data-fx-level", a.level);
  listeners.forEach((l) => l());
}

export function readSaved(): (Partial<Appearance> & { explicit?: boolean }) | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** A choice made in the panel: applied at once and remembered. */
export function choose(change: Partial<Appearance>) {
  const next = { ...attrs(), ...change };
  apply(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, explicit: true }));
  } catch {
    /* private window or blocked storage: it still applies for this visit */
  }
}

/** Back to the couple's defaults, and forget this browser's choice. */
export function resetTo(defaults: Appearance) {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to forget */
  }
  let fx = defaults.fx;
  try {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) fx = "none";
  } catch {
    /* no matchMedia: keep the default */
  }
  apply({ ...defaults, fx });
}

/*
 * Also watch the attributes themselves, so anything that sets them (the boot
 * script running late, another component, a test) is picked up too — the
 * attributes are the truth, not this module's memory of them.
 */
let observer: MutationObserver | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!observer && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => listeners.forEach((l) => l()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-paper-theme", "data-paper-tone", "data-fx", "data-fx-level"],
    });
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}

const snapshot = () => {
  const a = attrs();
  return `${a.paper}|${a.fx}|${a.level}|${a.tone}`;
};

export function useAppearance(server: Appearance): Appearance {
  const key = useSyncExternalStore(subscribe, snapshot, () => `${server.paper}|${server.fx}|${server.level}|${server.tone}`);
  const [paper, fx, level, tone] = key.split("|");
  return { paper: paper as PaperTheme, fx: fx as FxMode, level: level as FxLevel, tone };
}

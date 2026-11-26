"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FilmPreload } from "./useFilmPreload";

/**
 * Whether the invitation is ready to be opened: every picture it will show
 * (ImagePreload's list) and the pre-wedding film have arrived. Until then the
 * opening page's open button shows how far it has got and does not open, so
 * nothing pops in half-loaded after the guest taps.
 *
 * A picture that fails counts as done (it would never arrive), and after
 * READY_CAP_MS the guest may open regardless, so a very slow or broken
 * connection never leaves them stuck on the first page.
 */
export const READY_CAP_MS = 45000;

export type OpeningReady = { ready: boolean; progress: number };

const Ctx = createContext<OpeningReady>({ ready: true, progress: 1 });
export const OpeningReadyProvider = Ctx.Provider;
export const useOpeningReadyState = () => useContext(Ctx);

export function useOpeningReady(
  images: string[],
  film: FilmPreload,
  /** the film is an uploaded file being downloaded (an embed can't be) */
  filmFile: boolean,
  enabled: boolean,
): OpeningReady {
  const list = useMemo(() => [...new Set(images)], [images.join("\n")]); // eslint-disable-line react-hooks/exhaustive-deps
  const [loaded, setLoaded] = useState(0);
  const [capped, setCapped] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let count = 0;
    setLoaded(0);
    const done = () => {
      if (!alive) return;
      count += 1;
      setLoaded(count);
    };
    // the same addresses as the <link rel="preload">s, so these are served
    // from that download rather than fetched twice
    list.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = done;
      img.onerror = done;
      img.src = src;
    });
    const cap = window.setTimeout(() => alive && setCapped(true), READY_CAP_MS);
    return () => {
      alive = false;
      clearTimeout(cap);
    };
  }, [enabled, list]);

  if (!enabled) return { ready: true, progress: 1 };
  const imageShare = list.length ? loaded / list.length : 1;
  // the film, when there is one to download, is usually the heavy part
  const progress = filmFile ? imageShare * 0.35 + film.progress * 0.65 : imageShare;
  const ready = capped || (loaded >= list.length && film.settled);
  return { ready, progress: ready ? 1 : Math.min(0.99, progress) };
}

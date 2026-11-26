"use client";

import { useEffect, useRef } from "react";
import { useOpeningReadyState } from "./openingReady";

/**
 * The opening sound: plays on the first page, before the guest opens the
 * invitation, and fades away as they do (then the background music takes
 * over, as before).
 *
 * Browsers only let sound start from a guest's gesture. So it tries to start
 * at once (allowed on a site the browser already trusts), and if that is
 * refused it starts on the guest's first touch, click or key anywhere on the
 * page — including a tap on the open button while the invitation is still
 * loading. A tap that actually opens the invitation does not start it, so
 * the guest never hears a blip of it cut short.
 */
export function PreMusic({ src, loop, playing }: { src: string; loop: boolean; playing: boolean }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const { ready } = useOpeningReadyState();
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    if (!src) return;
    const a = new Audio(src);
    a.loop = loop;
    a.preload = "auto";
    a.setAttribute("playsinline", "");
    audio.current = a;
    const tryPlay = () => {
      if (!playingRef.current || !a.paused) return;
      a.play().catch(() => {
        /* not yet allowed: the next gesture starts it */
      });
    };
    tryPlay();

    const onGesture = (e: Event) => {
      if (!playingRef.current) return;
      const t = e.target as Element | null;
      // this tap opens the invitation: let the opening's own music take over
      if (readyRef.current && t && typeof t.closest === "function" && t.closest("[data-open-control]")) return;
      tryPlay();
    };
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    const types = ["pointerdown", "touchend", "keydown"];
    types.forEach((type) => document.addEventListener(type, onGesture, opts));

    // a phone put away: be quiet, and carry on when the guest comes back
    const onVisibility = () => {
      if (document.hidden) a.pause();
      else if (playingRef.current && !a.ended) tryPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      types.forEach((type) => document.removeEventListener(type, onGesture, opts));
      document.removeEventListener("visibilitychange", onVisibility);
      a.pause();
      a.removeAttribute("src");
      a.load();
      audio.current = null;
    };
  }, [src, loop]);

  /* the guest opened: fade out over ~0.7 s, then stop */
  useEffect(() => {
    const a = audio.current;
    if (playing || !a || a.paused) return;
    const from = a.volume;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      // a frame's timestamp can be a little before t0: keep k within 0–1
      const k = Math.min(1, Math.max(0, (now - t0) / 700));
      a.volume = Math.min(1, Math.max(0, from * (1 - k)));
      if (k < 1) raf = requestAnimationFrame(step);
      else {
        a.pause();
        a.volume = from;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return null;
}

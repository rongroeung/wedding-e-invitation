"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** `useLayoutEffect` on the client, `useEffect` on the server. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A couple of degrees of turn following the pointer, on devices that have one.
 *
 * The point is parallax, not interaction: the envelope should feel like an
 * object sitting in front of the guest, and an object in front of you shifts
 * when you move. Four degrees is about the limit — past that it stops reading
 * as a held object and starts reading as a toy.
 *
 * Only on a fine pointer, so it never competes with a finger, and never under
 * reduced motion. Updates are coalesced into one animation frame, so a fast
 * mouse cannot force more work than the display can show.
 */
export function usePointerTilt(active: boolean) {
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (!active) {
      setTilt(null);
      return;
    }
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || still) return;

    const onMove = (event: PointerEvent) => {
      if (frame.current) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = 0;
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        // Turn towards the pointer horizontally, away from it vertically —
        // which is how a sheet held in front of you actually behaves.
        setTilt({ x: -y * 5, y: x * 6 });
      });
    };
    const onLeave = () => setTilt(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [active]);

  return tilt;
}

/**
 * Whether this device should be asked for the expensive parts.
 *
 * Blurred shadows, masked highlights and stacked drop-shadows are cheap on a
 * laptop and not cheap on a four-year-old phone running inside a chat app's
 * webview — which is where most of these invitations are opened. The check is
 * deliberately crude: the alternative is measuring frame times, which costs
 * frames on exactly the devices that cannot spare them.
 */
export function useRichDevice() {
  /*
   * It starts at `false`, and the direction matters more than the test.
   *
   * It used to start `true`, so the server's HTML and the first client render
   * were always the expensive scene, and a phone rasterised all of it — every
   * blur, every stacked drop-shadow, both turbulence layers — before an effect
   * told it not to. The device least able to afford that work was made to do it
   * anyway, once, in the exact seconds the guest is looking at the envelope and
   * deciding to tap. Downgrading afterwards does not give those seconds back.
   *
   * The other way round, the cheap scene is what everyone is served and a
   * capable machine upgrades before its first paint. Nobody pays for a frame
   * they were never going to keep.
   */
  const [rich, setRich] = useState(false);

  useIsomorphicLayoutEffect(() => {
    type Nav = Navigator & { deviceMemory?: number };
    const nav = navigator as Nav;
    const cores = nav.hardwareConcurrency ?? 8;
    /* Safari does not implement `deviceMemory` at all, so on the one platform
       this most needs to be right about, the memory half of the old test was
       always answering "8". A coarse pointer is the honest signal there. */
    const memory = nav.deviceMemory ?? 8;
    const phone = window.matchMedia("(pointer: coarse)").matches;
    setRich(cores > (phone ? 6 : 4) && memory > 3);
  }, []);

  return rich;
}

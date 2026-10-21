"use client";

import { useEffect, useRef } from "react";

/**
 * The gold butterfly on the couple's name logo — on the envelope's flap and
 * on the cover — alive.
 *
 * Two wings and a body, so the wings can fold in 3D about the body (each one
 * turns on `rotateY` under a short perspective, catching less light as it
 * rises). A small state machine drives it, the way a butterfly at rest
 * behaves:
 *
 *   rest     the wings opening and closing slowly, as it basks;
 *   flutter  every few seconds a quick burst of beats;
 *   flight   now and then it takes off: a small loop out from the logo and
 *            back, beating fast, the body turning into the direction of
 *            travel and lifting off the paper (its shadow falls further and
 *            softer), then a landing and a few settling beats.
 *
 * While the logo's own entrance is playing (the butterfly flying in, in CSS)
 * the wings beat fast. Everything is written as custom properties on this
 * element; the loop stops when the logo is off screen, and reduced motion
 * leaves the wings still and open.
 */
export function Butterfly({ className = "" }: { className?: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      /* no matchMedia */
    }

    let seed = (Math.random() * 1e9) >>> 0;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

    type Mode = "rest" | "flutter" | "flight" | "settle";
    let mode: Mode = "rest";
    let since = 0;
    let t = 0;
    let nextFlutter = 2 + rnd() * 3;
    let nextFlight = 7 + rnd() * 7;
    let flightDir = rnd() < 0.5 ? 1 : -1;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let px = 0;
    let py = 0;
    let heading = 0;

    const set = (wing: number, tx = 0, ty = 0, rot = 0, alt = 0) => {
      el.style.setProperty("--bf-wing", `${wing.toFixed(1)}deg`);
      el.style.setProperty("--bf-shade", (Math.sin((wing * Math.PI) / 180) * 0.32).toFixed(3));
      el.style.setProperty("--bf-tx", `${tx.toFixed(1)}%`);
      el.style.setProperty("--bf-ty", `${ty.toFixed(1)}%`);
      el.style.setProperty("--bf-rot", `${rot.toFixed(1)}deg`);
      el.style.setProperty("--bf-alt", alt.toFixed(3));
    };
    const beat = (hz: number, lo: number, hi: number, at = since) => lo + (hi - lo) * (0.5 - 0.5 * Math.cos(2 * Math.PI * hz * at));

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;
      t += dt;
      since += dt;

      // the logo's entrance: the butterfly is flying in
      if (el.getAnimations().some((a) => a.playState === "running")) {
        set(beat(9, 12, 74, t));
        return;
      }

      if (mode === "rest") {
        // basking: a slow, uneven opening and closing
        const w = 8 + 34 * (0.5 - 0.5 * Math.cos(2 * Math.PI * since / 2.9)) * (0.75 + 0.25 * Math.sin(since * 0.7));
        set(w);
        if (t > nextFlight) {
          mode = "flight";
          since = 0;
          flightDir = -flightDir;
          px = 0;
          py = 0;
          heading = 0;
        } else if (t > nextFlutter) {
          mode = "flutter";
          since = 0;
        }
      } else if (mode === "flutter") {
        set(beat(8, 10, 66));
        if (since > 0.38 + rnd() * 0.02) {
          mode = "rest";
          since = 0;
          nextFlutter = t + 2.5 + rnd() * 4;
        }
      } else if (mode === "flight") {
        const D = 2.8;
        const u = Math.min(1, since / D);
        const lift = Math.sin(Math.PI * u);
        // a loop out from the logo and back to the same spot
        const x = flightDir * (78 * Math.sin(Math.PI * u) + 22 * Math.sin(2 * Math.PI * u));
        const y = -70 * Math.pow(lift, 1.1) + 18 * Math.sin(2 * Math.PI * u);
        // face the direction of travel (measured, not derived)
        const vx = x - px;
        const vy = y - py;
        px = x;
        py = y;
        if (Math.hypot(vx, vy) > 0.05) heading = (Math.atan2(vy, vx) * 180) / Math.PI + 90;
        const turn = ((heading + 540) % 360) - 180;
        // each downstroke lifts the body a hair
        const bob = -4 * Math.max(0, Math.sin(2 * Math.PI * 9 * since));
        set(beat(9.5, 14, 78), x, y + bob, turn * Math.min(1, lift * 2.2), lift);
        if (u >= 1) {
          mode = "settle";
          since = 0;
        }
      } else {
        // landing: a few beats, slowing, then still
        const decay = Math.max(0, 1 - since / 0.9);
        set(10 + 52 * decay * (0.5 - 0.5 * Math.cos(2 * Math.PI * 5 * since)));
        if (since > 0.9) {
          mode = "rest";
          since = 0;
          nextFlutter = t + 2 + rnd() * 3;
          nextFlight = t + 9 + rnd() * 9;
        }
      }
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    });
    io.observe(el);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <span ref={root} className={`bf ${className}`} aria-hidden="true">
      <span className="bf-flight">
        <span className="bf-wing bf-wing-l">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kit/butterfly-wing.svg" alt="" draggable={false} />
        </span>
        <span className="bf-wing bf-wing-r">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kit/butterfly-wing.svg" alt="" draggable={false} />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bf-body" src="/kit/butterfly-body.svg" alt="" draggable={false} />
      </span>
    </span>
  );
}

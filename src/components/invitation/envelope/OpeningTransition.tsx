"use client";

import type { ReactNode } from "react";

/**
 * The frame the whole opening is played inside, and the last step of it.
 *
 * It used to carry a room of its own — warm paper, candlelight, a vignette.
 * That room has moved into `CinemaRoom`, where it belongs: the environment is
 * now a dark set with its own key light, bokeh and dust, and two backdrops
 * arguing over the same pixels put the envelope on a pale sheet inside a dark
 * room. So this is the frame and nothing more — transparent, with the room
 * behind it doing all the lighting.
 *
 * When the card fills the screen this whole veil fades, and what is underneath
 * is the invitation, already laid out and already interactive, with the velvet
 * still across it. Nothing is hidden and then shown; one thing becomes another.
 */
export function OpeningTransition({
  children,
  gone,
  duration,
}: {
  children: ReactNode;
  gone: boolean;
  /** Fade length in milliseconds. */
  duration: number;
}) {
  return (
    <div
      className={`env-veil fixed inset-0 z-[80] overflow-hidden overscroll-contain ${
        gone ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ ["--env-veil" as string]: `${duration}ms` }}
      role="dialog"
      aria-modal="true"
      aria-label="សំបុត្រអញ្ជើញ"
    >
      {children}
    </div>
  );
}

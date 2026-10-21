"use client";

import { useMemo } from "react";

import type { Wedding } from "@/lib/db/schema";

import { RoomFx } from "./RoomFx";

/**
 * The room the envelope is opened in.
 *
 * A dark, warm, shallow space: one soft key light from above and to the left,
 * everything else falling away into near-black. The envelope is the only thing
 * properly lit, which is the whole reason for building a room at all — an
 * object on a pale page is a picture of an object, and an object in a pool of
 * light is a thing sitting on a table.
 *
 * Three populations of particle, and they are three because they do three
 * different jobs:
 *
 *   • **Bokeh** — large, soft, badly out of focus, drifting almost too slowly
 *     to see. This is what says *camera*: the eye reads unfocused highlights as
 *     evidence of a lens with a wide aperture, and nothing else in CSS buys
 *     that reading so cheaply.
 *   • **Dust** — small, sharp, near-white, rising. Real air is full of it, and
 *     under a raking light it is the first thing a camera picks up.
 *   • **Sparkles** — a handful of gold points that come up and go again. Used
 *     sparingly and never more than a few at once: the brief asks for delicate,
 *     and a screen full of twinkles is a screensaver.
 *
 * Everything animates on `transform` and `opacity` only. The blurs are static
 * per element — set once, never animated — so each blurred disc is rasterised
 * once and then only moved, which is the difference between this running on a
 * mid-range phone and not.
 */

/**
 * Deterministic placement.
 *
 * A seeded generator rather than `Math.random`, because this renders on the
 * server first: random positions would differ between the server's HTML and the
 * client's first render, React would report a hydration mismatch, and the whole
 * field would jump on mount. The same seed gives the same room every time.
 */
function scatter(count: number, seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: next(),
    y: next(),
    scale: next(),
    delay: next(),
    span: next(),
  }));
}

export function CinemaRoom({
  lit,
  rich,
  photo = "",
  wedding,
  synced = false,
}: {
  lit: boolean;
  rich: boolean;
  /** For the live layer: the couple's default animation. */
  wedding?: Wedding;
  /** The room in a deep shade of the chosen paper rather than burgundy. */
  synced?: boolean;
  /**
   * The couple's cover photograph. Laid behind everything, blurred and taken
   * down to dusk, so the envelope stands in front of their own picture rather
   * than a generic room. Without one the room is dusk on its own.
   */
  photo?: string;
}) {
  /* Fewer of everything on a device that cannot spare the compositing. */
  /*
   * Fewer than there were. Twenty-six motes of dust and seven sparkles read as
   * an effect laid over the room; a handful of soft out-of-focus lights and a
   * few motes read as air. The envelope is the subject.
   */
  const bokeh = useMemo(() => scatter(rich ? 7 : 4, 9871), [rich]);
  const dust = useMemo(() => scatter(rich ? 8 : 4, 4421), [rich]);
  const sparks = useMemo(() => scatter(rich ? 2 : 1, 7717), [rich]);

  return (
    <div className={`room ${synced ? "room-synced" : ""}`} aria-hidden="true">
      {/* the air of the room, and the pool of light the envelope stands in */}
      <span className="room-air" />
      {/* Dusk: the room taken down so the blush envelope and the gold read. */}
      <span
        className={`room-dusk ${photo ? "room-dusk-photo" : ""}`}
        style={photo ? { ["--room-photo" as string]: `url("${photo.replace(/"/g, "%22")}")` } : undefined}
      />
      <span className={`room-key ${lit ? "room-key-on" : ""}`} />
      <span className="room-grain" />
      <span className="room-vignette" />
      {wedding && <RoomFx wedding={wedding} rich={rich} />}

      {bokeh.map((p, i) => (
        <span
          key={`b${i}`}
          className="room-bokeh"
          style={{
            left: `${(p.x * 116 - 8).toFixed(2)}%`,
            top: `${(p.y * 116 - 8).toFixed(2)}%`,
            // Wide spread: a field of same-sized discs reads as a pattern.
            width: `${(2.2 + p.scale * 7).toFixed(2)}rem`,
            filter: `blur(${(6 + p.scale * 16).toFixed(1)}px)`,
            opacity: 0.06 + p.span * 0.13,
            animationDuration: `${(17 + p.delay * 15).toFixed(1)}s`,
            animationDelay: `${(-p.span * 22).toFixed(1)}s`,
          }}
        />
      ))}

      {dust.map((p, i) => (
        <span
          key={`d${i}`}
          className="room-dust"
          style={{
            left: `${(p.x * 100).toFixed(2)}%`,
            top: `${(p.y * 100).toFixed(2)}%`,
            width: `${(1 + p.scale * 1.6).toFixed(2)}px`,
            opacity: 0.08 + p.span * 0.2,
            animationDuration: `${(13 + p.delay * 12).toFixed(1)}s`,
            animationDelay: `${(-p.span * 20).toFixed(1)}s`,
          }}
        />
      ))}

      {sparks.map((p, i) => (
        <span
          key={`s${i}`}
          className="room-spark"
          style={{
            left: `${(12 + p.x * 76).toFixed(2)}%`,
            top: `${(14 + p.y * 68).toFixed(2)}%`,
            width: `${(2.4 + p.scale * 2.4).toFixed(2)}px`,
            animationDuration: `${(4.5 + p.delay * 4).toFixed(1)}s`,
            animationDelay: `${(p.span * 6).toFixed(1)}s`,
          }}
        />
      ))}
    </div>
  );
}

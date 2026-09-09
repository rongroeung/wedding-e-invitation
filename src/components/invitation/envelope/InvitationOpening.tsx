"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Guest, Wedding } from "@/lib/db/schema";
import type { EnvelopeConfig } from "@/lib/envelope";
import type { FrameConfig } from "@/lib/frame";
import { CinemaRoom } from "./CinemaRoom";
import { Envelope } from "./Envelope";
import { EnvelopeAddress } from "./EnvelopeAddress";
import { OpenButton } from "./OpenButton";
import { OpeningTransition } from "./OpeningTransition";
import { SkipButton } from "./SkipButton";
import { usePointerTilt, useRichDevice } from "./usePointerTilt";

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * React warns about `useLayoutEffect` during server rendering, correctly: there
 * is no layout pass to run before. This is the standard way to ask for
 * "before paint, if there is a paint" without the warning.
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Steps of the opening, in order. Each one only ever moves forward. */
type Step = "closed" | "unsealed" | "doors" | "fill" | "done";

const ORDER: Step[] = ["closed", "unsealed", "doors", "fill", "done"];
const at = (step: Step) => ORDER.indexOf(step);

/** Where each step begins, as a fraction of the configured total. */
/*
 */
/*
 * Where each beat begins, as a fraction of the configured run.
 *
 * The seal gets its own beat before the doors move at all, and that beat is the
 * reason the opening reads as a physical one: something was holding the panels
 * shut, it gives, and only then do they swing. Cue the two together and the
 * seal was never doing anything.
 */
const CUE: Record<Exclude<Step, "closed">, number> = {
  unsealed: 0.05,
  doors: 0.16,
  /*
   * When the hand-over to the velvet begins.
   *
   * This is the fourth attempt at these numbers, and the failure that produced
   * this one is worth writing down because nothing about it showed up in a
   * still frame. The dissolve is eased `ease` — front-loaded, two thirds gone
   * in the first third of its run — and the panels were eased with a very soft
   * foot, barely moving for their first half-second. Cued a fraction apart,
   * the two curves ran in opposite directions: the veil was most of the way
   * gone before the panels had visibly started, so the one gesture the whole
   * scene exists for was played almost entirely inside a fade. Each animation
   * measured correct on its own. Only the pair was wrong.
   *
   * So the panels now start early and move immediately, and the dissolve waits
   * until they are about two thirds open — far enough that the sliding is the
   * thing being watched, not so far that the envelope is ever seen to come to
   * rest around an empty lined box, which is the one frame in the sequence
   * with nothing in it.
   *
   * The panels are also given longer than the dissolve, on purpose: they are
   * still travelling when the last of the envelope goes, so they are never
   * seen to stop. An envelope that comes to rest has nothing left to show —
   * the invitation is not inside it any more — and the frame it rests into is
   * an empty lined box. Overlapping the two is not a way of hiding that frame;
   * it is a way of never reaching it.
   *
   * The gap between `fill` and `done` is the dissolve (0.45 of the run, set
   * below). A transition longer than the beat it lives in is still moving when
   * its element is removed.
   */
  fill: 0.42,
  done: 0.9,
};

export const envelopeSeenKey = (code: string) => `wedding:envelope:${code || "home"}`;

/**
 * The sealed invitation a guest opens before the invitation itself.
 *
 * The whole piece is CSS 3D. That is a deliberate constraint rather than a
 * shortcut: these invitations are opened on mid-range phones inside Telegram
 * and Messenger, and `transform`/`opacity` are the only properties a browser
 * animates without touching the main thread. A WebGL envelope would look no
 * better on a 520px card and would cost a megabyte and a warm battery.
 *
 * The sequence is one continuous movement — seal, doors, hand-over — driven by
 * timers that only ever advance, so an interrupted or backgrounded tab lands on
 * the same final state rather than half-open.
 *
 * What it hands over to is the velvet, which has been hanging behind the veil
 * since the panels started to move. The envelope opens; the curtains reveal.
 * The invitation itself is never shown twice.
 */
export function InvitationOpening({
  wedding,
  guest,
  envelope,
  frame,
  onOpen,
  onFinished,
}: {
  wedding: Wedding;
  guest: Guest | null;
  envelope: EnvelopeConfig;
  frame: FrameConfig;
  /**
   * The envelope is done with, one step before the end — early enough that
   * anything cued to it (the music, say) is already running as the veil goes.
   */
  onOpen: () => void;
  /** The envelope has left the screen. Called once, after `onOpen`. */
  onFinished: () => void;
}) {
  /*
   * The scene is visible from the server's own HTML, and nothing client-side
   * has to happen for a guest to see it.
   *
   * It used to be rendered at `opacity: 0` and revealed by an effect once we
   * knew whether this guest had opened the envelope already this visit. That
   * put the entire opening behind a single client-side signal, and when that
   * signal did not arrive — a chunk that failed to load on a phone's
   * connection, a browser old enough to choke on something in the bundle, an
   * extension — the guest was left looking at an empty room with a skip button
   * in the corner and no way to tell anything was wrong. For an invitation that
   * is the worst failure there is: it does not look broken, it looks *empty*.
   *
   * The visit check now runs in a layout effect, which fires before the browser
   * paints, so a returning guest still never sees a frame of an envelope they
   * have already opened — and a guest whose JavaScript never runs at all gets a
   * still envelope they can tap rather than a blank screen.
   */
  /*
   * The push begins before the guest does anything.
   *
   * The brief opens on a slow camera move toward the envelope, and this
   * invitation waits for a tap — so the move has to be the *waiting* state
   * rather than the first thing the tap triggers. It starts a beat after the
   * room appears and creeps in over several seconds, which means the envelope
   * is already coming towards the guest while they are deciding to touch it,
   * and the tap continues a movement instead of starting one.
   */
  const [pushed, setPushed] = useState(false);
  const [step, setStep] = useState<Step>("closed");
  const rich = useRichDevice();
  const timers = useRef<number[]>([]);
  const opened = useRef(false);
  const checked = useRef(false);
  /*
   * The opening has been asked for. Not the same question as `step !== "closed"`:
   * state is asynchronous, and the whole point of what follows is that several
   * independent listeners may answer the *same* tap within one frame — a
   * `touchend`, the `click` the browser synthesises from it, and the button's
   * own handler. All three would read `step` as `closed` and each would schedule
   * its own set of timers.
   */
  const started = useRef(false);

  const D = envelope.duration;

  /*
   * `onOpen` is an inline closure in the page above, so it is a new function
   * on every render. Reading it through a ref keeps `finish` stable — and a
   * stable `finish` is what stops the "already seen" effect below from
   * re-running mid-animation and cutting the opening short, since by then this
   * visit has of course been recorded.
   */
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const cleared = useRef(false);

  const finish = useCallback(() => {
    if (opened.current) return;
    opened.current = true;
    onOpenRef.current();
  }, []);

  /** The overlay is out of the way; hand the stage to the invitation. */
  const clear = useCallback(() => {
    setStep("done");
    if (cleared.current) return;
    cleared.current = true;
    onFinishedRef.current();
  }, []);

  /*
   * Was this envelope already opened during this visit? Asked once, before the
   * first paint — `useLayoutEffect`, not `useEffect`, because the whole point
   * is to take the overlay away before the browser has drawn it. On the server
   * there is no layout pass and no `sessionStorage` either, so it degrades to
   * `useEffect` there and the check simply happens on the client as before.
   */
  useIsomorphicLayoutEffect(() => {
    if (checked.current) return;
    checked.current = true;
    if (envelope.everyVisit) return;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(envelopeSeenKey(guest?.code ?? "")) === "1";
    } catch {
      // Private mode, or storage blocked by the in-app browser: show it.
    }
    if (seen) {
      finish();
      clear();
    }
  }, [envelope.everyVisit, guest?.code, finish]);

  /* A beat after the room is up, start the camera moving. */
  useEffect(() => {
    const timer = setTimeout(() => setPushed(true), 240);
    return () => clearTimeout(timer);
  }, []);

  /*
   * Proof that this component's effects ran — which is proof that React
   * hydrated, and therefore that the taps on this overlay are wired up.
   *
   * Written straight to the DOM rather than held in state, because the thing
   * reading it is the `?diag=1` panel, which is deliberately not React. It
   * costs one attribute and it is the difference between "the envelope's tap
   * handler is broken" and "nothing on this page is interactive", which are
   * very different bugs and look identical to a guest.
   */
  useEffect(() => {
    document.querySelector("[data-opening]")?.setAttribute("data-hydrated", "yes");
  }, []);

  /*
   * Which step the opening has reached, published to the DOM for `?diag=1`.
   *
   * This is the line that settles the question four rounds of bug reports have
   * not: "stuck" can mean the tap never arrived, or it arrived and the sequence
   * did not run, and those are entirely different faults that look identical
   * from the other end. If the step is still `closed` after a tap, nothing
   * reached `start`. If it advances and the screen does not, the timers are
   * running and something else is wrong.
   */
  useEffect(() => {
    document.querySelector("[data-opening]")?.setAttribute("data-step", step);
  });

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const remember = useCallback(() => {
    try {
      window.sessionStorage.setItem(envelopeSeenKey(guest?.code ?? ""), "1");
    } catch {
      // Nothing to do — the guest simply sees the envelope again next time.
    }
  }, [guest?.code]);

  /** Straight to the invitation: the skip button, or a guest who asked for
   *  reduced motion, or an admin who turned the animation off. */
  const jump = useCallback(() => {
    started.current = true;
    timers.current.forEach(clearTimeout);
    remember();
    finish();
    setStep("fill");
    timers.current.push(window.setTimeout(clear, 420) as unknown as number);
  }, [clear, finish, remember]);

  const start = useCallback(() => {
    if (started.current || step !== "closed") return;
    started.current = true;
    remember();

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !envelope.animate) {
      jump();
      return;
    }

    setStep("unsealed");
    (Object.keys(CUE) as Exclude<Step, "closed">[]).forEach((next) => {
      if (next === "unsealed") return;
      timers.current.push(
        window.setTimeout(() => {
          /*
           * `fill` used to measure the card mid-flight and land it exactly on
           * the invitation's own card underneath — same width, same top edge,
           * so the two gold frames coincided and one dissolved into the other.
           * It was accurate to a fraction of a pixel and it is gone, because
           * the card it was aiming is gone: the envelope now hands over to the
           * curtains rather than to a second copy of the cover. What is left is
           * a plain cross-dissolve between two scenes that share a palette, a
           * centre and a camera, which needs no arithmetic at all.
           */
          if (next === "fill") finish();
          if (next === "done") clear();
          else setStep(next);
        }, CUE[next] * D) as unknown as number,
      );
    });
  }, [step, D, envelope.animate, clear, finish, jump, remember]);

  /*
   * A tap that arrived before this component existed.
   *
   * The envelope is in the server's HTML and looks ready long before the
   * bundle has hydrated, and a guest who taps in that window used to get
   * nothing — the target was there, it just had no handler yet. How long the
   * window is depends entirely on the phone and the connection, so the same
   * invitation opens instantly for one guest and ignores two or three taps for
   * another. That is the "stuck, often" this has been reported as.
   *
   * A capture-phase listener in the document head counts those taps (see
   * `layout.tsx`). Here we spend the count, once, on mount. It runs after the
   * "already seen this visit" check above, so a returning guest — whose
   * overlay is being taken away in a layout effect — never has a stale tap
   * replayed into an opening they have already watched.
   */
  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    const w = window as unknown as { __envTap?: number };
    if (!w.__envTap) return;
    w.__envTap = 0;
    if (opened.current) return;
    startRef.current();
  }, []);

  /*
   * A tap anywhere opens the envelope — and it is listened for on the document,
   * not on the target.
   *
   * The report that produced this: *"it always works when I screen record, or
   * when I swipe the notification panel down and back up."* Those two actions
   * have nothing in common at the level of this component. They have exactly one
   * thing in common at the level of the browser — both force WebKit to redo the
   * page's layout and recomposite it, and with it the **touch-event region map**
   * iOS keeps to decide which element a finger has landed on. A workaround that
   * is "record your screen" is the signature of that map being stale: the taps
   * were arriving all along and being resolved against the wrong element, or
   * against nothing.
   *
   * Which is why this listens on `document`, in the capture phase, for the touch
   * itself. Whatever the stale map decides the finger hit, it hit *something* in
   * this document, and the event passes through here on its way down. The
   * question "which element was under the finger" — the one question that was
   * being answered wrongly — stops being asked at all. That is a stronger fix
   * than any target can be, because it does not depend on hit-testing being
   * right; it only depends on the touch being delivered.
   *
   * `.env-anywhere` stays, because it is what makes this a *control*: a real
   * button with a label, reachable by keyboard and announced by a screen reader.
   * This is the safety net under it, not a replacement for it.
   *
   * Both `touchend` and `click` are taken. A finger fires the first immediately;
   * the second is synthesised a moment later, and a mouse or a keyboard fires
   * only the second. `started` above makes answering the same gesture twice
   * harmless. A touch that travelled or dwelt is not a tap and is ignored, so a
   * guest brushing the screen does not open their invitation by accident.
   */
  useEffect(() => {
    if (step !== "closed") return;

    let x = 0;
    let y = 0;
    let t0 = 0;

    /* The one control on this overlay that means something else. */
    const isSkip = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest(".env-skip");

    const down = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      x = touch.clientX;
      y = touch.clientY;
      t0 = Date.now();
    };

    const up = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      if (Date.now() - t0 > 700) return;
      if (Math.abs(touch.clientX - x) > 12 || Math.abs(touch.clientY - y) > 12) return;
      if (isSkip(event.target)) return;
      start();
    };

    const tap = (event: MouseEvent) => {
      if (isSkip(event.target)) return;
      start();
    };

    document.addEventListener("touchstart", down, true);
    document.addEventListener("touchend", up, true);
    document.addEventListener("click", tap, true);
    return () => {
      document.removeEventListener("touchstart", down, true);
      document.removeEventListener("touchend", up, true);
      document.removeEventListener("click", tap, true);
    };
  }, [step, start]);

  /* A couple of degrees of parallax while the envelope is still closed. */
  const tilt = usePointerTilt(step === "closed");

  /* Hold the page still behind the envelope. */
  useEffect(() => {
    if (step === "done") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [step]);

  if (step === "done") return null;

  const index = at(step);
  const closed = step === "closed";

  /*
   * The camera. Two acts now, not three.
   *
   *   **Push.** While the envelope is still sealed the camera creeps in from a
   *   wide shot. Nothing else in the frame moves, so this is the only thing
   *   carrying the shot, and it has to be slow enough to be felt rather than
   *   watched.
   *
   *   **Ease back**, as the two panels swing outward — and then hold. The
   *   retreat is arithmetic, not taste: each panel hinges at its outer edge and
   *   turns to 140°, so its free edge swings out past the envelope by cos(40°)
   *   × half the width, and an envelope W across needs 1.77 W of frame at the
   *   widest moment of the opening.
   *
   * The third act — driving in on the card until it filled the frame — has gone
   * with the card. What follows the hold is the veil dissolving onto the velvet
   * that has been standing behind it since the panels started to move.
   */
  const camera = closed
    ? [
        pushed ? "scale(1)" : "scale(0.82)",
        tilt ? `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "translate3d(0, 2%, 0) scale(0.8) rotateX(2deg)";

  return (
    /*
     * The fade is sized to the gap between `fill` and `done` — 0.76 of the run,
     * so a 0.7 dissolve finishes with room to spare. It was once longer than
     * the step it lived in, and the overlay was unmounted halfway through its
     * own dissolve and simply vanished. A fade has to be over before the thing
     * fading is taken away.
     */
    <OpeningTransition gone={step === "fill"} duration={Math.round(D * 0.45)}>
      <CinemaRoom lit={index >= at("doors")} rich={rich} />

      <div
        className="env-stage flex h-full w-full items-center justify-center px-4"
      >
        {/*
          * The whole screen opens the envelope, and the target does not move.
          *
          * The tap used to be on the envelope drawing itself — which spends the
          * first 6.2 seconds after load running a `transform` transition, the
          * slow camera push. Hit-testing an element mid-transform is where
          * WebKit and the compositor disagree: the tap resolves against where
          * the element *was*, not where it is drawn, so it lands on nothing.
          * Wait for the push to finish and the same tap works, which is exactly
          * the "stuck, often" it was reported as.
          *
          * It never showed on a desktop, and that is the tell rather than a
          * coincidence: a mouse moving over the page gives `usePointerTilt` a
          * value, which swaps the camera to the 380ms parallax transition and
          * cancels the six-second one within moments of the page loading. A
          * finger produces no such event, so on a phone the long transition
          * runs its full course — through precisely the window in which anybody
          * would tap.
          *
          * This target is a sibling of the drawing, `inset: 0` on the stage, and
          * carries no transform of its own, so there is nothing to disagree
          * about. It is also simply better: a guest should not have to hit the
          * paper to open an envelope that fills the screen.
          */}
        {closed && (
          <button
            type="button"
            className="env-anywhere tappable"
            onClick={start}
            aria-label={wedding.envelopeOpenLabel}
          />
        )}

        {/* The column is a layout box and nothing else, so it lets taps
            through to the target behind it; only the controls inside it take
            pointer events back. */}
        <div className="env-column pointer-events-none relative z-[1] flex w-full flex-col items-center">
          <EnvelopeAddress wedding={wedding} guest={guest} gone={index >= at("unsealed")} />

          <div
            /* While it is closed the drawing takes no pointer events at all,
               so a tap can only ever land on the static target above — the
               moving element is never hit-tested. */
            className={`env-piece ${closed ? "pointer-events-none" : ""} ${
              closed && !tilt ? "env-idle" : ""
            } ${rich ? "" : "env-lite"}`}
            style={{
              /* How wide the piece is — and why that number is what it is —
                 lives in `.env-piece` in the stylesheet, because it needs a
                 `@supports` guard that an inline style cannot carry. */
              ["--env-paper" as string]: envelope.paper,
              ["--env-paper-shade" as string]: envelope.paperShade,
              ["--env-paper-deep" as string]: envelope.paperDeep,
              ["--env-ink" as string]: envelope.ink,
              ["--env-gold" as string]: envelope.gold,
              ["--env-gold-light" as string]: envelope.goldLight,
              ["--env-gold-deep" as string]: envelope.goldDeep,
              ["--env-seal" as string]: envelope.seal,
              ["--env-seal-ink" as string]: envelope.sealInk,
              ["--env-seal-t" as string]: `${Math.round(D * 0.16)}ms`,
              /*
               * The panels take most of the run: heavy paper on two hinges, and
               * the only thing in the shot that moves. They are still moving
               * long after the dissolve has begun, and are never seen to stop.
               */
              ["--env-door" as string]: `${Math.round(D * 0.62)}ms`,
              /*
               * One speed for everything the envelope's own layers do. There
               * used to be two — a slower one for the card rising and a quicker
               * one for its approach — and with the card gone there is nothing
               * left that needs to be told apart.
               */
              ["--env-move" as string]: `${Math.round(D * 0.26)}ms`,
              transform: camera,
              /*
               * Three different speeds on the same property, and they have to
               * be told apart. The pointer parallax answers in a third of a
               * second because it is a response to a hand. The opening push is
               * six seconds because it is a camera on a dolly. Everything after
               * the tap uses `--env-move`, set per step above.
               */
              transition: closed
                ? tilt
                  ? "transform 380ms cubic-bezier(0.22, 0.61, 0.28, 1)"
                  : "transform 6200ms cubic-bezier(0.32, 0, 0.5, 1)"
                : undefined,
            }}
          >
            <Envelope
              envelope={envelope}
              phase={{
                unsealed: index >= at("unsealed"),
                doorsOpen: index >= at("doors"),
              }}
            />

          </div>

          <div className="env-open pointer-events-auto mt-6 sm:mt-10">
            <OpenButton
              label={wedding.envelopeOpenLabel}
              hint={wedding.envelopeHint}
              onOpen={start}
              hidden={!closed}
            />
          </div>
        </div>
      </div>

      {envelope.skip && (
        <SkipButton label={wedding.envelopeSkipLabel} onSkip={jump} hidden={!closed} />
      )}
    </OpeningTransition>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Guest, Wedding } from "@/lib/db/schema";
import type { EnvelopeConfig } from "@/lib/envelope";
import type { FrameConfig } from "@/lib/frame";
import { CinemaRoom } from "./CinemaRoom";
import { envelopeFace } from "@/lib/artwork";

import { Envelope } from "./Envelope";
import { EnvelopeAddress } from "./EnvelopeAddress";
import { EnvelopeHeading } from "./EnvelopeHeading";
import { OpenButton } from "./OpenButton";
import { OpeningTransition } from "./OpeningTransition";
import { usePointerTilt, useRichDevice } from "./usePointerTilt";
import { useOpeningReadyState } from "../openingReady";

/** Steps of the opening, in order. Each one only ever moves forward. */
type Step = "closed" | "press" | "lift" | "flap" | "card" | "lower" | "fill" | "done";

const ORDER: Step[] = ["closed", "press", "lift", "flap", "card", "lower", "fill", "done"];
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
/*
 * The opening as one physical action, in fractions of the run (6.2 s default):
 *
 *   0.00  —      anticipation: the guest has tapped; nothing moves yet
 *   0.07  press  the seal is pressed very slightly against the paper
 *   0.12  lift   …released: the wax lets go of the pocket and settles on the
 *                flap's point, where it stays (it turns away with the flap)
 *   0.27  flap   the flap lifts at its point and turns back on its hinge
 *                (0.225 of the run); its lining comes round with it
 *   0.50  card   the card is drawn up out of the pocket at a slight angle,
 *                and the envelope gives a little downward (0.26)
 *   0.76  lower  the envelope drops out of the shot; the card comes toward
 *                the camera; the room goes dark (0.21)
 *   0.91  fill   the veil lifts out of the dark onto the curtains
 *   0.995 done   the overlay is unmounted
 *
 * Each beat starts a moment before the last one has fully settled, so the
 * movement overlaps the way a hand does — but the seal has always let go
 * before the flap moves, and the flap is past upright before the card starts out,
 * because the physical action needs them to be.
 *
 * Everything only moves forward and every timer is on `timers`, so a skip, a
 * backgrounded tab or an unmount mid-run lands on the same final state.
 */
const CUE: Record<Exclude<Step, "closed">, number> = {
  press: 0.07,
  lift: 0.12,
  flap: 0.27,
  card: 0.5,
  lower: 0.76,
  fill: 0.91,
  done: 0.995,
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
  onStart,
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
  /**
   * The guest has started the opening. Fires on the tap itself, before any of
   * it has moved — the page above uses it to make sure the velvet is standing.
   */
  onStart?: () => void;
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
  /*
   * Resolved once per render rather than per panel: both panels draw the same
   * picture, and resolving it twice is how the two halves would eventually
   * come to disagree about which one it is.
   */
  const face = envelopeFace(wedding);
  const match = wedding.envelopeMatchPaper;
  const syncOr = (name: string, value: string) => (match ? `var(--sync-env-${name}, ${value})` : value);
  const envColours = {
    ["--env-paper" as string]: syncOr("paper", envelope.paper),
    ["--env-paper-shade" as string]: syncOr("paper-shade", envelope.paperShade),
    ["--env-paper-deep" as string]: syncOr("paper-deep", envelope.paperDeep),
    ["--env-ink" as string]: syncOr("ink", envelope.ink),
    ["--env-gold" as string]: syncOr("gold", envelope.gold),
    ["--env-gold-light" as string]: syncOr("gold-light", envelope.goldLight),
    ["--env-gold-deep" as string]: syncOr("gold-deep", envelope.goldDeep),
    ["--env-seal" as string]: syncOr("seal", envelope.seal),
    ["--env-seal-ink" as string]: syncOr("seal-ink", envelope.sealInk),
  };
  /* The couple's cover photograph is not laid behind the envelope: it is used
     only as the picture of the shared invitation link. */
  const timers = useRef<number[]>([]);
  const opened = useRef(false);
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
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;
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

  /* Not until every picture and the film have arrived (openingReady): the
     tap is ignored and the open button shows how far the loading has got. */
  const { ready } = useOpeningReadyState();
  const readyRef = useRef(ready);
  readyRef.current = ready;

  /** Straight to the invitation: the skip button, or a guest who asked for
   *  reduced motion, or an admin who turned the animation off. */
  const jump = useCallback(() => {
    if (!readyRef.current) return;
    started.current = true;
    onStartRef.current?.();
    timers.current.forEach(clearTimeout);
    remember();
    finish();
    setStep("fill");
    timers.current.push(window.setTimeout(clear, 420) as unknown as number);
  }, [clear, finish, remember]);

  const start = useCallback(() => {
    if (!readyRef.current) return;
    if (started.current || step !== "closed") return;
    started.current = true;
    onStartRef.current?.();
    remember();

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !envelope.animate) {
      jump();
      return;
    }

    (Object.keys(CUE) as Exclude<Step, "closed">[]).forEach((next) => {
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
   * The guest opens the invitation with the open button and nothing else: no
   * tap anywhere on the page, no skip link and no "already seen this visit"
   * shortcut. The button is itself a link (OpenButton), which is what kept the
   * whole-page tap working on iPhones whose scripts were still busy.
   */

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
  /*
   * The push is a luxury, and on the wrong device it is the fault.
   *
   * Scaling `.env-piece` for 6.2 seconds means everything inside it is
   * re-rasterised on every frame of those 6.2 seconds — and inside it are
   * blurred shadows, five stacked emboss passes and, until now, a four-octave
   * turbulence filter. Measured on a throttled phone, the first eight seconds
   * after load were five seconds of blocked main thread, with single stalls
   * over 1.5s and frames a second and a half apart. A page in that state does
   * not answer anything: not a div, not a button, not a link. Which is exactly
   * what was reported, in that order, over six rounds.
   *
   * So a device that cannot afford the move does not get it. The envelope is
   * simply there, at rest, and the main thread is free the moment it has
   * painted once. Everything else about the scene is unchanged, and a desktop
   * still gets the camera it was designed with.
   */
  const camera = closed
    ? [
        !rich || pushed ? "scale(1)" : "scale(0.82)",
        tilt ? `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : /* the framing per beat is in CSS variables, so a short landscape
         screen can take a wider shot (see `.env-veil` in globals.css) */
      index >= at("lower")
      ? "translate3d(0, var(--pe-cam-low-y, 10%), 0) scale(var(--pe-cam-low-s, 0.9))"
      : index >= at("card")
        ? /* room above for the card as it comes out */
          "translate3d(0, var(--pe-cam-card-y, 20%), 0) scale(var(--pe-cam-card-s, 0.86))"
        : index >= at("flap")
          ? /* a touch of room for the open flap */ "translate3d(0, 8%, 0) scale(0.96)"
          : "translate3d(0, 0, 0) scale(1)";

  return (
    /*
     * The fade is sized to the gap between `fill` and `done` — 0.76 of the run,
     * so a 0.7 dissolve finishes with room to spare. It was once longer than
     * the step it lived in, and the overlay was unmounted halfway through its
     * own dissolve and simply vanished. A fade has to be over before the thing
     * fading is taken away.
     */
    <OpeningTransition gone={step === "fill"} duration={Math.round(D * 0.08)}>
      <CinemaRoom lit={index >= at("lift")} rich={rich} wedding={wedding} synced={match} />

      <div
        className="env-stage flex h-full w-full items-center justify-center px-4"
      >

        {/* The column is a layout box and nothing else, so it lets taps
            through to the target behind it; only the controls inside it take
            pointer events back. */}
        <div className="env-column pointer-events-none relative z-[1] flex w-full flex-col items-center">
          <EnvelopeHeading
            title={wedding.envelopeTitle}
            subtitle={wedding.envelopeSubtitle}
            gone={!closed}
          />
          <EnvelopeAddress wedding={wedding} guest={guest} gone={!closed} />

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
              /* With "match the paper" on, every colour is the chosen paper's
                 (set on <html> by the paper theme), falling back to the
                 envelope style for the couple's own picture-paper. */
              ...envColours,
              ["--pe-lift-t" as string]: `${Math.round(D * 0.15)}ms`,
              ["--pe-press-t" as string]: `${Math.round(D * 0.05)}ms`,
              ["--pe-flap-t" as string]: `${Math.round(D * 0.225)}ms`,
              ["--pe-card-t" as string]: `${Math.round(D * 0.26)}ms`,
              ["--pe-near-t" as string]: `${Math.round(D * 0.21)}ms`,
              /* The camera follows the action in one slow, eased move per beat. */
              ["--env-move" as string]: `${Math.round(D * 0.2)}ms`,
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
                  : rich
                    ? "transform 6200ms cubic-bezier(0.32, 0, 0.5, 1)"
                    : undefined
                : undefined,
            }}
          >
            <Envelope
              envelope={envelope}
              face={face}
              groom={wedding.groomName}
              bride={wedding.brideName}
              monogramFont={wedding.monogramFont}
              monogramText={wedding.monogram}
              flapMark={wedding.envelopeFlapMark === "monogram" ? "monogram" : "namelogo"}
              sealText={wedding.envelopeSealText}
              cardLines={{ lead: wedding.subtitle, title: wedding.title }}
              phase={{
                pressed: index >= at("press"),
                lifted: index >= at("lift"),
                flapOpen: index >= at("flap"),
                cardOut: index >= at("card"),
                lowered: index >= at("lower"),
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

      {/* The dark beat between the card reaching the camera and the curtains:
          above the whole set, so the card goes into it rather than past it. */}
      <span
        className={`env-dusk ${index >= at("lower") ? "env-dusk-on" : ""}`}
        style={{
          /* dark by 0.90 of the run, just before the veil starts to lift at
             0.91 — the veil must lift out of darkness, never out of a fade */
          transitionDuration: `${Math.round(D * 0.09)}ms`,
          transitionDelay: index >= at("lower") ? `${Math.round(D * 0.05)}ms` : "0ms",
        }}
        aria-hidden="true"
      />

    </OpeningTransition>
  );
}

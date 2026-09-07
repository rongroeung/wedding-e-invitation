"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoSource } from "@/lib/video";

/**
 * The pre-wedding film, played once between the envelope and the curtains.
 *
 * It stands in the one place in the visit where a guest is *watching* rather
 * than reading: the envelope has just come apart, the invitation has not been
 * revealed, and there is nothing on screen competing for attention. Anywhere
 * later and it interrupts something; anywhere earlier and it plays to a guest
 * who has not been greeted yet.
 *
 * **It is muted, and that is not a compromise.** Every mobile browser refuses
 * to start a video with sound without a gesture; a player told to autoplay and
 * then refused shows a paused frame with a play triangle in the middle of it,
 * which is the exact opposite of the effect this beat exists for. Muted, it
 * actually plays — and a guest opening an invitation on a bus is not ambushed.
 * The film's own audio is offered on a button, so anyone who wants it can have
 * it with one tap, which is the same tap the browser was asking for anyway.
 *
 * **It is always skippable, and the skip is visible from the first frame.**
 * This is somebody else's four minutes standing between a guest and the thing
 * they followed a link to read.
 *
 * **It hands over the same way everything else here does** — it is mounted and
 * fully opaque behind the envelope's veil before that veil dissolves, so the
 * arrival is a dissolve and never a cut. The one thing that must not happen is
 * the film appearing *as* the envelope leaves.
 */
export function PreWeddingVideo({
  source,
  skipLabel,
  continueLabel,
  gone,
  onDone,
}: {
  source: VideoSource;
  skipLabel: string;
  /** Wording for the button that carries on to the invitation. */
  continueLabel: string;
  /** Finished: fade out, and be unmounted a moment later. */
  gone: boolean;
  /** Called once, when the film has finished or the guest has said carry on. */
  onDone: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const done = useRef(false);
  const [muted, setMuted] = useState(true);
  /*
   * Whether the film is actually running.
   *
   * Used only to decide *which* button to offer — "skip" while it plays,
   * "carry on" once it has clearly failed to. A browser can refuse to autoplay
   * even a muted video (a data-saver mode, a locked-down enterprise profile),
   * and the failure is silent: no error, no event, just a first frame that
   * never becomes a second. Offering the same button either way is what stops
   * that being a dead end.
   */
  const [playing, setPlaying] = useState(source.kind === "embed");

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDone();
  }, [onDone]);

  /*
   * Ask to play, and do not assume the answer.
   *
   * `autoPlay` on the element is not enough on its own: it is honoured only
   * when the element is muted *at the moment the source is attached*, and it
   * gives back nothing to check. Calling `play()` returns a promise that
   * rejects when the browser says no, which is the only way to find out.
   */
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.muted = true;
    el.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, []);

  /*
   * An embed cannot tell us when it has ended.
   *
   * It is a cross-origin iframe, and asking it would mean loading YouTube's or
   * Vimeo's own JavaScript into the invitation. So the guest carries on when
   * they are ready, and the button says so rather than saying "skip" — there
   * is nothing to skip, it is simply the way out.
   */
  const embed = source.kind === "embed";

  return (
    <div
      className={`film ${gone ? "film-gone" : ""}`}
      aria-label="Pre-wedding film"
      role="dialog"
      aria-modal="true"
    >
      <span className="film-air" aria-hidden="true" />

      <div className="film-frame">
        {embed ? (
          <iframe
            className="film-media"
            src={source.src}
            title="Pre-wedding film"
            /*
             * Everything the player needs and nothing else. Without
             * `allow-scripts` and `allow-same-origin` no embed plays at all;
             * `allow-popups` is what lets "watch on YouTube" work for a guest
             * who wants the full thing. Forms, downloads and top-level
             * navigation are not on the list, so the film cannot take the
             * guest off the invitation.
             */
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video
            ref={video}
            className="film-media"
            src={source.src}
            poster={source.poster || undefined}
            autoPlay
            muted={muted}
            playsInline
            preload="auto"
            onEnded={finish}
            /*
             * A film that cannot be fetched must not become a wall. If the
             * source 404s or the codec is unsupported, the sequence carries
             * straight on to the curtains rather than holding a black frame
             * until somebody thinks to press skip.
             */
            onError={finish}
          />
        )}
      </div>

      <div className="film-controls" aria-hidden={gone}>
        {!embed && (
          <button
            type="button"
            className="film-sound"
            onClick={() => {
              const el = video.current;
              if (!el) return;
              el.muted = !el.muted;
              setMuted(el.muted);
              /* Unmuting is a gesture, so this is also the moment a browser
                 that refused to autoplay will finally agree to. */
              void el.play().then(() => setPlaying(true), () => undefined);
            }}
            aria-pressed={!muted}
          >
            {muted ? <SpeakerOff /> : <SpeakerOn />}
            <span>{muted ? "បើកសំឡេង" : "បិទសំឡេង"}</span>
          </button>
        )}

        <button type="button" className="film-skip" onClick={finish}>
          {embed || !playing ? continueLabel : skipLabel}
        </button>
      </div>
    </div>
  );
}

function SpeakerOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4v-5Z" strokeLinejoin="round" />
      <path d="M16.5 9.5 21 14M21 9.5 16.5 14" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerOn() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4v-5Z" strokeLinejoin="round" />
      <path d="M15.8 9.2a4 4 0 0 1 0 5.6M18.4 6.6a7.6 7.6 0 0 1 0 10.8" strokeLinecap="round" />
    </svg>
  );
}

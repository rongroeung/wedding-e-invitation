"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * Background music: ONE audio element for the whole page, however many
 * buttons show it.
 *
 * The page draws two buttons, a floating one for phones and one in the
 * desktop rail, and only CSS decides which is visible. Each used to own its
 * own `<audio>`, so both were mounted, both were told to start, and the song
 * played twice a fraction of a second apart: the "echo". Here the element is
 * created once, outside React, and every button is only a view of it.
 *
 * Starting it: browsers let sound start only from a guest's gesture, and the
 * music is meant to begin a little after the tap that opens the invitation
 * (when the envelope has finished), which is no longer "in" that gesture.
 * Chrome usually allows that; Safari on iPhone often does not, and when it
 * refuses there is no error a guest can see, only silence. So the first tap
 * anywhere on the page *unlocks* the element (a muted play-and-pause inside
 * the gesture), after which the delayed start is allowed everywhere. If a
 * start is still refused, the next tap starts it.
 */

type State = { playing: boolean };

let audio: HTMLAudioElement | null = null;
let currentSrc = "";
let unlocked = false;
let wanted = false; // the invitation has asked for the music to be on
let userPaused = false; // the guest turned it off: never restart it on their behalf
let state: State = { playing: false };
const listeners = new Set<() => void>();

function emit(next: State) {
  if (next.playing === state.playing) return;
  state = next;
  listeners.forEach((l) => l());
}

function element(src: string): HTMLAudioElement | null {
  if (typeof window === "undefined" || !src) return null;
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = "metadata";
    audio.setAttribute("playsinline", "");
    audio.addEventListener("play", () => emit({ playing: true }));
    audio.addEventListener("playing", () => emit({ playing: true }));
    audio.addEventListener("pause", () => emit({ playing: false }));
    audio.addEventListener("ended", () => emit({ playing: false }));
    installUnlock();
  }
  if (currentSrc !== src) {
    currentSrc = src;
    audio.src = src;
  }
  return audio;
}

function start() {
  const a = audio;
  if (!a || userPaused) return;
  a.muted = false;
  if (!a.paused) return;
  a.play().catch(() => {
    /* refused (no gesture yet): the next tap on the page starts it */
  });
}

/** Inside a gesture: make the element playable later, or start it now if it is wanted. */
function onGesture(e: Event) {
  const a = audio;
  if (!a) return;
  // a tap on a music button is that button's business (toggle), not a cue
  const t = e.target as Element | null;
  if (t && typeof t.closest === "function" && t.closest("[data-music-toggle]")) return;
  if (wanted && !userPaused && a.paused) {
    start();
    return;
  }
  if (unlocked || !a.paused) return;
  unlocked = true;
  a.muted = true;
  a.play()
    .then(() => {
      // only the unlock: stay silent until the invitation asks for the music
      if (!wanted || userPaused) a.pause();
      a.muted = false;
      if (!wanted && a.currentTime < 1) a.currentTime = 0;
    })
    .catch(() => {
      a.muted = false;
      unlocked = false;
    });
}

let unlockInstalled = false;
function installUnlock() {
  if (unlockInstalled) return;
  unlockInstalled = true;
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  for (const type of ["pointerdown", "touchend", "click", "keydown"]) {
    document.addEventListener(type, onGesture, opts);
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
const snapshot = () => state;
const serverSnapshot = () => state;

function toggle() {
  const a = audio;
  if (!a) return;
  if (a.paused) {
    userPaused = false;
    a.muted = false;
    a.play().catch(() => emit({ playing: false }));
  } else {
    userPaused = true;
    a.pause();
  }
}

export function MusicPlayer({
  src,
  title,
  autoStart,
  inline = false,
}: {
  src: string;
  title?: string;
  autoStart: boolean;
  /** Renders as a plain button for the desktop rail instead of floating. */
  inline?: boolean;
}) {
  const { playing } = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    element(src);
    setMounted(true);
  }, [src]);

  useEffect(() => {
    if (!autoStart || !src) return;
    element(src);
    wanted = true;
    start();
  }, [autoStart, src]);

  if (!src) return null;

  const button = (
    <button
      type="button"
      data-music-toggle=""
      onClick={toggle}
      title={title || "ភ្លេងផ្ទៃខាងក្រោយ"}
      aria-label={playing ? "បិទភ្លេង" : "បើកភ្លេង"}
      aria-pressed={playing}
      className={
        inline
          ? "flex h-11 w-11 items-center justify-center rounded-full bg-heading text-cream transition hover:brightness-110"
          : `music-float fixed bottom-5 right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-gold/45 bg-ivory/90 text-heading text-lg shadow-card backdrop-blur transition-transform duration-500 hover:scale-105 sm:bottom-7 sm:right-6 xl:hidden ${
              playing ? "animate-pulseSoft" : ""
            }`
      }
    >
      <SpeakerIcon muted={!playing} />
      {playing && !inline && (
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-champagne/30" />
      )}
    </button>
  );

  if (inline) return button;
  /*
   * The floating button is put on <body>. Inside the card it sat under
   * ancestors with transforms, filters and containment, and a `position:
   * fixed` element inside one of those is fixed to that ancestor, not to the
   * screen: Chrome then drew it somewhere off the visible card (or clipped
   * it), which is why it was sometimes missing there and not in Safari.
   */
  return mounted ? createPortal(button, document.body) : null;
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4v-5Z" strokeLinejoin="round" />
      {muted ? (
        <path d="m16 9.5 4.5 5m0-5-4.5 5" strokeLinecap="round" />
      ) : (
        <path d="M16 9c1.4 1.6 1.4 4.4 0 6m2.7-8.6c2.6 2.8 2.6 8.4 0 11.2" strokeLinecap="round" />
      )}
    </svg>
  );
}

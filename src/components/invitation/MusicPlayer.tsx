"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Floating background-music control. Playback is only ever started from a user
 * gesture (opening the invitation or tapping the button), which is what mobile
 * browsers require — nothing auto-plays with sound.
 */
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!autoStart || !audioRef.current) return;
    audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false)); // blocked by the browser — user can tap
  }, [autoStart]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  if (!src) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="none"
        onCanPlay={() => setReady(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        title={title || "ភ្លេងផ្ទៃខាងក្រោយ"}
        aria-label={playing ? "បិទភ្លេង" : "បើកភ្លេង"}
        className={
          inline
            ? "flex h-11 w-11 items-center justify-center rounded-full bg-heading text-cream transition hover:brightness-110"
            : `fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gold/45 bg-ivory/90 text-lg shadow-card backdrop-blur transition-transform duration-500 hover:scale-105 sm:bottom-7 sm:right-6 ${
                playing ? "animate-pulseSoft" : ""
              }`
        }
      >
        <SpeakerIcon muted={!playing} />
        {playing && !inline && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-champagne/30" />
        )}
        <span className="sr-only">{ready ? "" : ""}</span>
      </button>
    </>
  );
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

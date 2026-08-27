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
}: {
  src: string;
  title?: string;
  autoStart: boolean;
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
        className={`fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-champagne/60 bg-ivory/90 text-lg shadow-card backdrop-blur transition-transform duration-500 hover:scale-105 sm:bottom-7 sm:right-6 ${
          playing ? "animate-pulseSoft" : ""
        }`}
      >
        <span aria-hidden="true">{playing ? "🔊" : "🔇"}</span>
        {playing && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-champagne/30" />
        )}
        <span className="sr-only">{ready ? "" : ""}</span>
      </button>
    </>
  );
}

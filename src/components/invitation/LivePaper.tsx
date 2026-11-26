"use client";

import { useEffect, useRef } from "react";

/**
 * The paper of a film theme (3–11), alive: the theme's own loop playing
 * behind the writing (Theme 9), or the theme's picture slowly breathing —
 * a gentle push-in and drift — for the others. The same reading wash as the
 * still paper is laid over it (`--card-wash`), so the writing reads exactly
 * as before. With reduced motion it is the still picture, unmoving.
 */
export function LivePaper({ still, film }: { still: string; film?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    v.play().catch(() => {
      /* muted autoplay refused (low-power mode): the poster stays, which is the paper */
    });
    // no need to decode video for a page nobody is looking at
    const onVisibility = () => (document.hidden ? v.pause() : v.play().catch(() => {}));
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [film]);

  return (
    <div className="paper-live" aria-hidden="true">
      {film ? (
        <video
          ref={video}
          className="paper-live-media"
          src={film}
          poster={still}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
        />
      ) : (
        <span className="paper-live-media paper-live-still" style={{ backgroundImage: `url("${still}")` }} />
      )}
      <span className="paper-live-wash" />
    </div>
  );
}

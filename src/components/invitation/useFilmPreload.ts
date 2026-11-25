"use client";

import { useEffect, useState } from "react";
import type { VideoSource } from "@/lib/video";

/**
 * The pre-wedding film, fetched in full while the guest is still on the
 * opening page, so it starts at once (and plays without stalling) when the
 * envelope hands over to it.
 *
 * It waits for the page itself to finish loading, so it never competes with
 * the first screen, then downloads the file into memory and returns a local
 * `blob:` address for the player. Until that is ready — or if the download
 * fails, or the film is a YouTube/Vimeo embed, which cannot be fetched — the
 * original address is used, which streams as before.
 */
export function useFilmPreload(film: VideoSource | null): VideoSource | null {
  const [local, setLocal] = useState<string | null>(null);
  const src = film?.kind === "file" ? film.src : "";

  useEffect(() => {
    if (!src) return;
    let url: string | null = null;
    const ctl = new AbortController();
    const go = () => {
      fetch(src, { signal: ctl.signal })
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((blob) => {
          url = URL.createObjectURL(blob);
          setLocal(url);
        })
        .catch(() => {
          /* stream it instead */
        });
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      ctl.abort();
      window.removeEventListener("load", go);
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (!film) return null;
  return local && film.kind === "file" ? { ...film, src: local } : film;
}

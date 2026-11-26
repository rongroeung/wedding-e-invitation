"use client";

import { useEffect, useState } from "react";
import type { VideoSource } from "@/lib/video";

export type FilmPreload = {
  /** what the player is given: the local copy once it is in, else the original */
  source: VideoSource | null;
  /** 0–1, how much of the file has arrived (1 when there is nothing to fetch) */
  progress: number;
  /** finished one way or the other: downloaded, failed, or nothing to download */
  settled: boolean;
};

/**
 * The pre-wedding film, fetched in full while the guest is still on the
 * opening page, so it starts at once (and plays without stalling) when the
 * envelope hands over to it. The opening page waits for it (useOpeningReady).
 *
 * It waits for the page itself to finish loading, so it never competes with
 * the first screen, then downloads the file into memory — reporting how far
 * it has got — and returns a local `blob:` address for the player. Until that
 * is ready — or if the download fails, or the film is a YouTube/Vimeo embed,
 * which cannot be fetched — the original address is used, which streams as
 * before.
 */
export function useFilmPreload(film: VideoSource | null): FilmPreload {
  const [local, setLocal] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = film?.kind === "file" ? film.src : "";

  useEffect(() => {
    if (!src) return;
    let url: string | null = null;
    const ctl = new AbortController();
    const go = async () => {
      try {
        const r = await fetch(src, { signal: ctl.signal });
        if (!r.ok) throw new Error(String(r.status));
        const total = Number(r.headers.get("content-length")) || 0;
        let blob: Blob;
        if (r.body && total) {
          // read it piece by piece, so the opening page can show how far it is
          const reader = r.body.getReader();
          const parts: BlobPart[] = [];
          let got = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            parts.push(value);
            got += value.length;
            setProgress(Math.min(0.99, got / total));
          }
          blob = new Blob(parts, { type: r.headers.get("content-type") || "video/mp4" });
        } else {
          blob = await r.blob();
        }
        url = URL.createObjectURL(blob);
        setProgress(1);
        setLocal(url);
      } catch {
        if (!ctl.signal.aborted) setFailed(true); // stream it instead
      }
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      ctl.abort();
      window.removeEventListener("load", go);
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (!film) return { source: null, progress: 1, settled: true };
  if (film.kind !== "file") return { source: film, progress: 1, settled: true };
  return {
    source: local ? { ...film, src: local } : film,
    progress: local || failed ? 1 : progress,
    settled: Boolean(local) || failed,
  };
}

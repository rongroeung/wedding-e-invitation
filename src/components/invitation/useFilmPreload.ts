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
 * It starts at once and downloads the file in several pieces side by side
 * (byte ranges, see `download`), reporting how far it has got, then returns
 * a local `blob:` address for the player. Until that
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
        const blob = await download(src, ctl.signal, setProgress);
        url = URL.createObjectURL(blob);
        setProgress(1);
        setLocal(url);
      } catch {
        if (!ctl.signal.aborted) setFailed(true); // stream it instead
      }
    };
    // at once, alongside the first-screen pictures (not after the whole page)
    go();
    return () => {
      ctl.abort();
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

const PIECE = 2 * 1024 * 1024;
const SIDE_BY_SIDE = 4;

/**
 * The whole file, fetched as 2 MB byte ranges, four at a time.
 *
 * One request for the whole file is read out of the database a window at a
 * time, one window after another; pieces asked for side by side are read in
 * parallel, which is several times faster on a remote database. The first
 * piece also tells us the size. A server that ignores ranges answers the first
 * request with the whole file, which is simply read to the end.
 */
async function download(src: string, signal: AbortSignal, onProgress: (p: number) => void): Promise<Blob> {
  const first = await fetch(src, { signal, headers: { Range: `bytes=0-${PIECE - 1}` } });
  if (!first.ok) throw new Error(String(first.status));
  const type = first.headers.get("content-type") || "video/mp4";
  const total = Number(/\/(\d+)$/.exec(first.headers.get("content-range") ?? "")?.[1] ?? 0);

  if (first.status !== 206 || !total) {
    // no ranges here: the whole file in one answer, read to the end
    const length = Number(first.headers.get("content-length")) || 0;
    if (!first.body || !length) return first.blob();
    const reader = first.body.getReader();
    const parts: BlobPart[] = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      got += value.length;
      onProgress(Math.min(0.99, got / length));
    }
    return new Blob(parts, { type });
  }

  const parts: ArrayBuffer[] = [await first.arrayBuffer()];
  let got = parts[0].byteLength;
  onProgress(Math.min(0.99, got / total));
  const count = Math.ceil(total / PIECE);
  let next = 1;
  const worker = async () => {
    while (next < count) {
      const i = next++;
      const start = i * PIECE;
      const end = Math.min(total, start + PIECE) - 1;
      const r = await fetch(src, { signal, headers: { Range: `bytes=${start}-${end}` } });
      if (r.status !== 206) throw new Error(String(r.status));
      parts[i] = await r.arrayBuffer();
      got += parts[i].byteLength;
      onProgress(Math.min(0.99, got / total));
    }
  };
  await Promise.all(Array.from({ length: Math.min(SIDE_BY_SIDE, count - 1) }, worker));
  return new Blob(parts, { type });
}

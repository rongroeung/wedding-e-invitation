"use client";

import { useEffect, useState } from "react";

/**
 * The couple's own name-logo image, between the groom's and bride's names.
 *
 * "original": the image as uploaded.
 * "foil": the artwork printed in the invitation's gold on any paper. A logo
 * file usually comes with its own background (white art on burgundy, say), so
 * the mask is built here from the picture itself: the background colour is
 * read off the image's border, everything near it becomes fully transparent,
 * and the artwork fully solid, whichever of the two is the lighter. A plain
 * CSS luminance mask would leave a faint film of gold where a dark-but-not-
 * black background was.
 */
export function NameLogoImage({ src, mode, alt, className = "" }: { src: string; mode: string; alt: string; className?: string }) {
  const [mask, setMask] = useState<{ url: string; ratio: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (mode !== "foil") return;
    let gone = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("no canvas");
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        const lum = (i: number) => (px[i + 3] / 255) * (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) + (1 - px[i + 3] / 255) * -1;
        // the background: the median brightness round the border (transparent counts as "none")
        const border: number[] = [];
        for (let x = 0; x < w; x++) border.push(lum(x * 4), lum(((h - 1) * w + x) * 4));
        for (let y = 0; y < h; y++) border.push(lum(y * w * 4), lum((y * w + w - 1) * 4));
        border.sort((a, b) => a - b);
        const bg = border[border.length >> 1];
        const transparentBg = bg < 0;
        // the artwork: the opposite end of the range
        const all: number[] = [];
        for (let i = 0; i < px.length; i += 16) all.push(lum(i));
        all.sort((a, b) => a - b);
        const artLight = transparentBg || bg < 128;
        const art = artLight ? all[Math.floor(all.length * 0.98)] : all[Math.floor(all.length * 0.02)];
        const lo = transparentBg ? 0 : bg + (art - bg) * 0.18;   // a little past the background: no film
        const hi = transparentBg ? 0 : bg + (art - bg) * 0.75;
        for (let i = 0; i < px.length; i += 4) {
          let a: number;
          if (transparentBg) a = px[i + 3] / 255;
          else {
            const v = (lum(i) - lo) / (hi - lo || 1);
            a = Math.max(0, Math.min(1, v));
          }
          px[i] = px[i + 1] = px[i + 2] = 255;
          px[i + 3] = Math.round(a * 255);
        }
        ctx.putImageData(data, 0, 0);
        const url = canvas.toDataURL("image/png");
        if (!gone) setMask({ url, ratio: w / h });
      } catch {
        if (!gone) setFailed(true);
      }
    };
    img.onerror = () => !gone && setFailed(true);
    img.src = src;
    return () => {
      gone = true;
    };
  }, [src, mode]);

  if (mode !== "foil" || failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`name-logo-img ${className}`} decoding="async" />;
  }
  return (
    <span
      role="img"
      aria-label={alt}
      className={`name-logo-foil ${className}`}
      style={
        mask
          ? ({ "--nl-mask": `url(${mask.url})`, aspectRatio: String(mask.ratio) } as React.CSSProperties)
          : { aspectRatio: "1.15", opacity: 0 }
      }
    />
  );
}

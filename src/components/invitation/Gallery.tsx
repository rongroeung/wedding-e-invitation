"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GalleryImage } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CARD_SCROLL_ID } from "./CardShell";

/** អនុស្សាវរីយ៍របស់យើង — magazine-style masonry gallery with a swipe lightbox. */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  );
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    // Freeze whichever element is actually scrolling behind the lightbox: the
    // card's region when the frame is fixed, otherwise the page.
    const region = document.getElementById(CARD_SCROLL_ID);
    const scroller =
      region && region.scrollHeight > region.clientHeight ? region : document.body;
    const previous = scroller.style.overflowY;
    scroller.style.overflowY = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      scroller.style.overflowY = previous;
    };
  }, [openIndex, close, next, prev]);

  if (images.length === 0) return null;
  const current = openIndex === null ? null : images[openIndex];

  /*
   * The lightbox is portalled into <body> rather than rendered in place.
   *
   * `position: fixed` escapes an ancestor's overflow, but not its containing
   * block — and the card's scroll region carries a mask, which establishes one.
   * Left in place, a photo opened clipped to the card and picked up the mask's
   * edge fade instead of filling the screen.
   */
  const lightbox = current && (
    <div
      className="fixed inset-0 z-[70] flex animate-fadeIn items-center justify-center bg-brown/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={close}
      onTouchStart={(e) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        if (!touchStart.current) return;
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
        touchStart.current = null;
      }}
    >
      <button
        type="button"
        onClick={close}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-champagne/40 text-2xl text-champagne"
        aria-label="បិទ"
      >
        ×
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-champagne/30 text-2xl text-champagne sm:left-6"
            aria-label="រូបភាពមុន"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-champagne/30 text-2xl text-champagne sm:right-6"
            aria-label="រូបភាពបន្ទាប់"
          >
            ›
          </button>
        </>
      )}

      <figure
        className="flex max-h-[92vh] w-full max-w-[94vw] flex-col items-center px-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaSrc(current.mediaId, current.url)}
          alt={current.caption || "អនុស្សាវរីយ៍"}
          className="max-h-[84vh] w-auto max-w-full animate-scaleIn rounded-xl object-contain shadow-2xl"
        />
        <figcaption className="mt-4 text-sm text-champagne/85 khmer-wrap">
          {current.caption}
          <span className="ml-3 font-latin text-xs text-champagne/50">
            {openIndex! + 1} / {images.length}
          </span>
        </figcaption>
      </figure>
    </div>
  );

  return (
    <section id="gallery" className="section-pad relative">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow="រូបភាព" title="អនុស្សាវរីយ៍របស់យើង" />

        <div className="reveal columns-2 gap-3 sm:gap-4">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group mb-3 block w-full overflow-hidden rounded-2xl bg-cream shadow-card sm:mb-4"
              aria-label={image.caption || `រូបភាពទី ${index + 1}`}
            >
              <span className="relative block overflow-hidden rounded-2xl bg-gold-sheen p-[1.5px]">
                <span className="block overflow-hidden rounded-[14px] bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaSrc(image.mediaId, image.url)}
                    alt={image.caption || "អនុស្សាវរីយ៍"}
                    loading="lazy"
                    decoding="async"
                    className="w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                  />
                </span>
                {image.caption && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[14px] bg-gradient-to-t from-brown/75 to-transparent px-3 pb-3 pt-8 text-left text-[0.7rem] leading-relaxed text-cream opacity-0 transition-opacity duration-500 group-hover:opacity-100 khmer-wrap">
                    {image.caption}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {mounted && lightbox ? createPortal(lightbox, document.body) : null}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * The couple's map picture, opened on the invitation itself.
 *
 * Rendered into <body> (a portal): the card and its frame carry transforms,
 * and a fixed overlay inside a transformed element is fixed to that element,
 * not to the screen. Closes with ✕, Esc, or a tap outside the picture; a tap
 * on the picture switches between fitting the screen and full size (scroll to
 * read small street names). Focus goes to ✕ on opening and back to the
 * thumbnail on closing.
 */
export function MapViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [full, setFull] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="map-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`map-viewer-stage ${full ? "is-full" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="map-viewer-img"
          onClick={() => setFull((f) => !f)}
          title={full ? "បង្រួម" : "ពង្រីក"}
        />
      </div>
      <button ref={closeRef} type="button" className="map-viewer-close" onClick={onClose} aria-label="បិទ">
        ✕
      </button>
      <p className="map-viewer-hint khmer-wrap">{full ? "ចុចលើរូបដើម្បីបង្រួម" : "ចុចលើរូបដើម្បីមើលទំហំពេញ"}</p>
    </div>,
    document.body,
  );
}

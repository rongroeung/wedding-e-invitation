"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { FrameEdge } from "@/components/ui/CardFrame";
import type { FrameConfig } from "@/lib/frame";
import { PaperSurface } from "./appearance/PaperSurface";

/** The scrolling region inside the frame; Gallery locks it behind the lightbox. */
export const CARD_SCROLL_ID = "card-scroll";

/**
 * The invitation is presented as a single printed card: a fixed-width column of
 * paper stock, framed in gold, resting on a muted stage.
 *
 * The card is exactly one screen tall and never scrolls. Its frame is fixed at
 * the head and foot, and the invitation scrolls in the space between them — so
 * the ornament stays in view the whole way down, like a mount around a print,
 * and the content cannot slide underneath it.
 *
 * The card fills the screen (globals.css, "The card fills the screen"): the
 * whole window below 1280px, and everything between the two rails from
 * 1280px, where the stage divides into three zones — details, card, controls
 * — as an explicit grid. Both side columns are the same width.
 */
export function CardShell({
  children,
  cover,
  curtains,
  atmosphere,
  left,
  right,
  frame,
  scrollable,
}: {
  children: ReactNode;
  /** Overlays the scroll region until the guest opens the invitation. */
  cover?: ReactNode;
  /**
   * The velvet, hung across the card's own column.
   *
   * Not across the viewport, which is where it wants to go and where it must
   * not: on a wide screen the two side rails carry the guest's QR code and
   * their RSVP status, and curtains gathered at the edges of the *window* sit
   * on top of both of them for the rest of the visit. Hung in this column they
   * frame exactly what they are meant to frame at every width, and the stage
   * behind shows through either side of them on a desktop — which is what the
   * wings of a stage look like anyway.
   */
  curtains?: ReactNode;
  /** The live layer of motion above the paper (`CardFx`). */
  atmosphere?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  frame: FrameConfig;
  scrollable: boolean;
}) {
  const { sticky } = frame;
  /*
   * While the cover is up the card is exactly one screen tall even without a
   * fixed frame — otherwise the cover starts below the frame's head yet still
   * runs a full screen, pushing the monogram and button below the fold and
   * leaving the card looking half empty. Once opened, a non-sticky card is
   * released to flow with its content.
   */
  const oneScreen = sticky || !scrollable;

  /*
   * The frame's head and foot, measured, for the closed cover on a large
   * sheet. The corners take their height from the card's width, so on a wide
   * sheet the two bands reserve a third of the height while the paper between
   * the corners stands empty. The cover (and only the cover: the scrolling
   * invitation keeps the structural frame, so content never passes under the
   * gold) is allowed to rise into that space between the corners. CSS decides
   * when (globals.css, "The cover on a wide sheet"); this only reports sizes.
   */
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const measure = () => {
      // the corner on show: the frame's own, or a botanical suite's
      const corner = Array.from(el.querySelectorAll<HTMLElement>(".frame-corner-tl, .bt-tl")).find(
        (c) => c.offsetWidth > 0,
      );
      const edges = el.querySelectorAll<HTMLElement>(":scope > .frame-edge");
      if (!corner || edges.length < 2) {
        el.removeAttribute("data-bands");
        return;
      }
      el.style.setProperty("--band-top", `${edges[0].offsetHeight}px`);
      el.style.setProperty("--band-bottom", `${edges[edges.length - 1].offsetHeight}px`);
      el.style.setProperty("--corner-w", `${corner.offsetWidth}px`);
      el.setAttribute("data-bands", "");
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.querySelectorAll(":scope > .frame-edge").forEach((e) => ro.observe(e));
    return () => ro.disconnect();
  }, [frame]);

  return (
    <div className={`stage ${oneScreen ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"}`}>
      <div
        className={`stage-grid mx-auto flex w-full justify-center ${
          oneScreen ? "h-full xl:grid-rows-[minmax(0,1fr)]" : "min-h-[100dvh]"
        }`}
      >
        {/* ── Zone 1 · event details ───────────────────────────────────── */}
        <aside
          className={`zone-side hidden min-h-0 xl:block xl:border-r ${
            oneScreen ? "h-full overflow-y-auto" : "sticky top-0 h-[100dvh] overflow-y-auto"
          }`}
        >
          <div className="px-4 py-7 2xl:px-7 2xl:py-8">{left}</div>
        </aside>

        {/* ── Zone 2 · the card ────────────────────────────────────────── */}
        <div
          className={`zone-centre relative flex min-h-0 w-full justify-center ${oneScreen ? "h-full" : ""}`}
        >
          <div
            ref={sheet}
            style={{
              // how much of each band the cover must leave clear: the hairline
              // joining the corners, and the ornament on it
              ["--band-keep" as string]: Math.max(0.3, frame.joinY + 0.14).toFixed(3),
            }}
            className={`card-stock card-sheet paper relative flex w-full flex-col overflow-hidden ${
              oneScreen ? "h-full" : "min-h-[100dvh]"
            }`}
          >
            {/* the paper the card is printed on, then the live layer above it */}
            <PaperSurface />
            {/* a botanical suite's double rule, between its corners */}
            {!frame.custom && <span className="bt-border" aria-hidden="true" />}
            {atmosphere}

            <FrameEdge frame={frame} edge="top" />

            <div className="relative z-20 min-h-0 flex-1">
              {frame.sideRules && (
                <>
                  <span className="frame-side-rule pointer-events-none absolute inset-y-0 left-[1.6%] w-px bg-gold-frame/35" aria-hidden="true" />
                  <span className="frame-side-rule pointer-events-none absolute inset-y-0 right-[1.6%] w-px bg-gold-frame/35" aria-hidden="true" />
                </>
              )}

              {/*
                * Sticky: this region scrolls and the frame stays put.
                * Otherwise the page scrolls and the frame travels with it, so
                * the region must simply grow to its content.
                */}
              <div
                id={CARD_SCROLL_ID}
                className={
                  sticky
                    ? `scroll-fade h-full overscroll-contain ${scrollable ? "overflow-y-auto" : "overflow-hidden"}`
                    : oneScreen
                      ? "h-full overflow-hidden"
                      : ""
                }
              >
                <div className="frame-safe">{children}</div>
              </div>

              {cover}
            </div>

            <FrameEdge frame={frame} edge="bottom" />
          </div>

          {curtains}
        </div>

        {/* ── Zone 3 · controls ────────────────────────────────────────── */}
        <aside
          className={`zone-side hidden min-h-0 xl:block xl:border-l ${
            oneScreen ? "h-full overflow-y-auto" : "sticky top-0 h-[100dvh] overflow-y-auto"
          }`}
        >
          <div className="px-4 py-7 2xl:px-7 2xl:py-8">{right}</div>
        </aside>
      </div>
    </div>
  );
}

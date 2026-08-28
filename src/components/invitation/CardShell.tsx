"use client";

import type { ReactNode } from "react";
import { FrameEdge } from "@/components/ui/CardFrame";
import type { FrameConfig } from "@/lib/frame";
import { LiveBackdrop } from "./LiveBackdrop";

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
 * On wide screens the stage divides into three zones — details, card, controls
 * — as an explicit grid. The side zones carry their own surface and a hairline
 * edge; the centre is a slightly lighter runway. Both side columns are the same
 * width, so the card lands exactly centred.
 */
export function CardShell({
  children,
  cover,
  left,
  right,
  frame,
  scrollable,
}: {
  children: ReactNode;
  /** Overlays the scroll region until the guest opens the invitation. */
  cover?: ReactNode;
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

  return (
    <div className={`stage ${oneScreen ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"}`}>
      <div
        className={`mx-auto flex w-full max-w-[2100px] justify-center xl:grid xl:grid-cols-[minmax(280px,21%)_minmax(0,1fr)_minmax(280px,21%)] ${
          oneScreen ? "h-full xl:grid-rows-[minmax(0,1fr)]" : "min-h-[100dvh]"
        }`}
      >
        {/* ── Zone 1 · event details ───────────────────────────────────── */}
        <aside
          className={`zone-side hidden min-h-0 xl:block xl:border-r ${
            oneScreen ? "h-full overflow-y-auto" : "sticky top-0 h-[100dvh] overflow-y-auto"
          }`}
        >
          <div className="px-6 py-8 2xl:px-8">{left}</div>
        </aside>

        {/* ── Zone 2 · the card ────────────────────────────────────────── */}
        <div
          className={`zone-centre flex min-h-0 w-full max-w-[560px] justify-center xl:max-w-none xl:px-8 ${
            oneScreen ? "h-full xl:py-8" : "xl:py-8"
          }`}
        >
          <div
            className={`card-stock paper relative flex w-full flex-col overflow-hidden xl:max-w-[560px] xl:rounded-[3px] ${
              oneScreen ? "h-full" : "min-h-[100dvh]"
            }`}
          >
            {/* Fewer motes and no sheen here — the long scroll should stay calm */}
            <div className="pointer-events-none absolute inset-0 z-0">
              <LiveBackdrop count={7} glow={false} sheen={false} />
            </div>

            <FrameEdge frame={frame} edge="top" />

            <div className="relative z-20 min-h-0 flex-1">
              {frame.sideRules && (
                <>
                  <span className="pointer-events-none absolute inset-y-0 left-[1.6%] w-px bg-gold-frame/35" aria-hidden="true" />
                  <span className="pointer-events-none absolute inset-y-0 right-[1.6%] w-px bg-gold-frame/35" aria-hidden="true" />
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
                {children}
              </div>

              {cover}
            </div>

            <FrameEdge frame={frame} edge="bottom" />
          </div>
        </div>

        {/* ── Zone 3 · controls ────────────────────────────────────────── */}
        <aside
          className={`zone-side hidden min-h-0 xl:block xl:border-l ${
            oneScreen ? "h-full overflow-y-auto" : "sticky top-0 h-[100dvh] overflow-y-auto"
          }`}
        >
          <div className="px-6 py-8 2xl:px-8">{right}</div>
        </aside>
      </div>
    </div>
  );
}

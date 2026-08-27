import type { CSSProperties, ReactNode } from "react";
import { CardFrame } from "@/components/ui/CardFrame";
import type { FrameConfig } from "@/lib/frame";
import { LiveBackdrop } from "./LiveBackdrop";

/**
 * The invitation is presented as a single printed card: a fixed-width column of
 * paper stock, framed in gold, resting on a muted stage.
 *
 * On wide screens the stage is divided into three distinct zones — details,
 * card, controls — as an explicit grid rather than three blocks floating in one
 * continuous field. The side zones carry their own surface and a hairline edge;
 * the centre is a slightly lighter runway the card sits on. Both side columns
 * are the same width, so the card lands exactly centred.
 */
export function CardShell({
  children,
  left,
  right,
  frame,
}: {
  children: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  frame: FrameConfig;
}) {
  return (
    <div className="stage min-h-screen">
      <div className="mx-auto flex w-full max-w-[2100px] justify-center xl:grid xl:min-h-screen xl:grid-cols-[minmax(280px,21%)_minmax(0,1fr)_minmax(280px,21%)]">
        {/* ── Zone 1 · event details ───────────────────────────────────── */}
        <aside className="zone-side hidden xl:block xl:border-r">
          <div className="sticky top-0 px-6 py-8 2xl:px-8">{left}</div>
        </aside>

        {/* ── Zone 2 · the card ────────────────────────────────────────── */}
        <div className="zone-centre flex w-full max-w-[560px] justify-center xl:max-w-none xl:px-8 xl:py-8">
          <div
            className="card-stock paper relative min-h-screen w-full xl:min-h-0 xl:max-w-[560px] xl:rounded-[3px]"
            style={{ "--frame-clear": frame.clearance } as CSSProperties}
          >
            <CardFrame frame={frame} />
            {/* Fewer motes and no sheen here — the long scroll should stay calm */}
            <div className="pointer-events-none absolute inset-0 z-0">
              <LiveBackdrop count={7} glow={false} sheen={false} />
            </div>
            <div className="relative z-20">{children}</div>
          </div>
        </div>

        {/* ── Zone 3 · controls ────────────────────────────────────────── */}
        <aside className="zone-side hidden xl:block xl:border-l">
          <div className="sticky top-0 px-6 py-8 2xl:px-8">{right}</div>
        </aside>
      </div>
    </div>
  );
}

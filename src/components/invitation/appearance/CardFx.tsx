"use client";

import { useEffect, useRef } from "react";

import type { Appearance } from "@/lib/appearance";

import { isDarkSheet } from "@/lib/appearance";
import { startFx } from "./fxEngine";
import { useAppearance } from "./store";

/**
 * The live layer above the paper: depth-of-field gold dust that twinkles and
 * now and then flares into a star, rose petals that fall and tumble with
 * their shadows on the sheet, and slowly drifting light (see `fxEngine`).
 *
 * It follows the appearance choice live: a change of mode, intensity or
 * paper restarts only this canvas. Nothing is drawn on the server; the
 * canvas starts on the client, after the page is interactive.
 */
export function CardFx({ defaults, rich }: { defaults: Appearance; rich: boolean }) {
  const { fx, level, paper, tone } = useAppearance(defaults);
  // a dark paper colour chosen over the design needs the motion's dark palette too
  const dark = isDarkSheet(paper, tone);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || fx === "none") return;
    return startFx(canvas, { fx, level, paper, rich, ...(dark ? { tone: "dark" as const } : {}) });
  }, [fx, level, paper, rich, dark]);

  if (fx === "none") return null;
  return (
    <div className="card-fx" aria-hidden="true">
      <canvas ref={ref} className="fx-canvas" data-fx-mode={fx} />
    </div>
  );
}

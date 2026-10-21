"use client";

import { useEffect, useRef } from "react";

import { type Appearance, appearanceDefaults } from "@/lib/appearance";
import type { Wedding } from "@/lib/db/schema";

import { startFx } from "../appearance/fxEngine";
import { useAppearance } from "../appearance/store";

/**
 * The live layer in the envelope's room: the same animation the guest will
 * see on the card (the couple's default, or the guest's own saved choice),
 * drawn behind the envelope in the room's palette — gold that gives light,
 * butterflies and blossoms lit by the room's key light — so the motion starts
 * before the envelope is opened and carries on, unbroken, onto the card.
 *
 * Reduced motion: the boot script has already set the animation to none
 * unless the guest chose one, and then this draws nothing.
 */
export function RoomFx({ wedding, rich }: { wedding: Wedding; rich: boolean }) {
  const defaults: Appearance = appearanceDefaults(wedding);
  const { fx, level, paper } = useAppearance(defaults);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || fx === "none") return;
    return startFx(canvas, { fx, level, paper, rich, tone: "dark" });
  }, [fx, level, paper, rich]);

  if (fx === "none") return null;
  return <canvas ref={ref} className="room-fx fx-canvas" data-fx-mode={fx} />;
}

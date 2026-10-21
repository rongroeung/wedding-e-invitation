"use client";

import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { CURTAIN_VALLEYS } from "./curtainFolds";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The curtains, as cloth rather than as stripes.
 *
 * **What it is made of.** Each panel is a pre-rendered photograph of light on
 * fabric: a heightfield of irregular hanging folds (gathered into pinch pleats
 * at the heading, flaring toward the hem, a few splitting on the way down) lit
 * by one soft key light from above and in front, with cavity occlusion in the
 * valleys and a restrained satin sheen only on the raised folds. It is stored
 * as *luminance* and tinted on the page with the theme's own cloth colour
 * (`background-blend-mode: luminosity`), so the shading is photographic and
 * the colour stays the couple's. A woven tile laid over it in `overlay` gives
 * the threads; it is sized in pixels, never stretched, so the weave keeps its
 * scale on every screen. See `scripts/curtain-fabric.py`.
 *
 * **How it moves.** A real curtain does not slide like a door. Each panel is
 * cut along its own valleys into one element per fold, and the folds are
 * gathered one after another: the leading edge is pulled first, each fold
 * starts only as the one beside it takes up the slack, and they stack at the
 * wall, compressed and overlapping, deeper in shadow. The hem trails the
 * heading on a damped spring, so the bottom of each fold follows the top a
 * moment late and settles without bouncing. Everything that moves is a
 * transform or an opacity on an already-painted layer, so a phone composites
 * it rather than repainting it.
 *
 * The motion is computed, not keyframed by hand: `plan()` integrates it once
 * when the curtain opens, and the Web Animations API plays the result.
 */

/** How long the parting takes, including the settle. The page strikes the set after it. */
export const CURTAIN_OPEN_MS = 3400;

/** The pull on the leading edge, before any fold has followed it. */
const PULL_MS = 2550;
/** How much later the outermost fold starts than the leading one. */
const STAGGER_MS = 420;
/** How much of each panel's width the gathered cloth still covers at the wall. */
const GATHERED = 0.2;
/** How far each fold's box reaches under its inner neighbour, so no join ever shows. */
const TUCK = 0.025;
/** The width of the shade a fold throws onto the one it has slid over. */
const SHADE_W = 0.07;

type SetName = keyof typeof CURTAIN_VALLEYS;
type Side = "left" | "right";

/** cubic-bezier(x1, y1, x2, y2) as a function of progress, solved numerically. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const f = ((ax * t + bx) * t + cx) * t - x;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= f / d;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}

/**
 * Soft foot, long settle: cloth this heavy starts almost imperceptibly and
 * comes to rest slowly. No overshoot in the pull itself — the only give is in
 * the hem.
 */
const pull = bezier(0.58, 0, 0.2, 1);

/** Where one fold of one panel sits, as fractions of the panel's width. */
type Fold = {
  /** The valleys either side, at 17 heights. */
  left: readonly number[];
  right: readonly number[];
  /** Their mean positions — where the fold "is" for the purposes of moving it. */
  a: number;
  b: number;
  /** The fold's own box: its outer valley to a little past its inner one. */
  x0: number;
  x1: number;
};

function foldsOf(set: SetName, side: Side): Fold[] {
  const lines = CURTAIN_VALLEYS[set][side];
  const mean = (l: readonly number[]) => l.reduce((s, v) => s + v, 0) / l.length;
  const out: Fold[] = [];
  for (let k = 0; k < lines.length - 1; k += 1) {
    const left = lines[k];
    const right = lines[k + 1];
    const last = k === lines.length - 2;
    out.push({
      left,
      right,
      a: mean(left),
      b: mean(right),
      // the outermost fold reaches past the wall, the rest start on their valley
      x0: k === 0 ? -0.04 : Math.min(...left),
      x1: last ? 1 : Math.max(...right) + TUCK,
    });
  }
  return out;
}

/**
 * The fold cut out along its own valleys.
 *
 * Its outer edge (the one that will slide over its neighbour) follows the
 * valley exactly, which is the darkest line on the cloth, so the moment it
 * starts to overlap it reads as a fold turning under rather than as an edge.
 * Its inner edge runs a little under the next fold, which is on top of it, so
 * while the curtain hangs closed there is no join anywhere — the same picture
 * meets itself.
 */
function clipOf(f: Fold, k: number, last: boolean) {
  const w = f.x1 - f.x0;
  const pct = (x: number) => `${(((x - f.x0) / w) * 100).toFixed(2)}%`;
  const n = f.left.length - 1;
  const at = (i: number) => `${((i / n) * 100).toFixed(2)}%`;
  const outer = f.left.map((x, i) => `${k === 0 ? "0%" : pct(x)} ${at(i)}`);
  const inner = f.right
    .map((x, i) => `${last ? "100%" : pct(Math.min(1, x + TUCK))} ${at(i)}`)
    .reverse();
  return `polygon(${[...outer, ...inner].join(", ")})`;
}

/**
 * Which way the cloth is gathered: by how wide a panel actually is.
 *
 * A fold is a physical size, about a hand across whatever it hangs on, so the
 * number of folds follows the panel's width rather than the window's. Narrow is
 * the server's answer, so a phone is right first; a wide panel upgrades in a
 * layout effect, before anything is painted.
 */
function useFoldSet(ref: React.RefObject<HTMLDivElement | null>): SetName {
  const [set, setSet] = useState<SetName>("narrow");
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setSet(el.clientWidth * 0.53 >= 300 ? "wide" : "narrow");
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return set;
}

type Plan = {
  times: number[];
  /** per fold: transform strings over time */
  fold: string[][];
  /** per fold: how deep in shade it is, over time */
  ao: number[][];
  /** per fold (from the second): the shade it throws on the fold beneath */
  shade: { x: string[]; o: number[] }[];
  /** the shadow the leading edge throws beyond itself */
  cast: { x: string[]; o: number[] };
};

/**
 * The whole parting, integrated once.
 *
 * Boundaries between folds are the carriers on the track. The leading one is
 * pulled; each one further out starts later, so the folds nearest the middle
 * close up first and the gathering travels outward toward the wall. A fold's
 * width is the distance between its two carriers, which is why folds compress
 * instead of sliding: nothing here is ever stretched wider than it hangs.
 *
 * The hem of each fold follows the middle of its heading on a slightly
 * under-damped spring — about a second's period — so the bottom trails while
 * the cloth is drawn and swings a fraction past before coming to rest. That
 * trail is expressed as a skew about the top edge, which is the one place the
 * cloth does not move.
 */
function plan(folds: Fold[], panelW: number, panelH: number, seed: number): Plan {
  const n = folds.length;
  // carriers at rest: the mean valleys, wall to leading edge
  const rest = [0, ...folds.map((f) => f.b)];
  rest[n] = 1;
  const widths = folds.map((f, k) => rest[k + 1] - rest[k]);
  // gathered: each fold keeps a share of the stack, a little uneven, as cloth is
  let jitter = seed;
  const rand = () => {
    jitter = (jitter * 9301 + 49297) % 233280;
    return jitter / 233280;
  };
  const share = widths.map((w) => w * (0.85 + rand() * 0.3));
  const total = share.reduce((s, v) => s + v, 0);
  const end = [0];
  share.forEach((s, k) => end.push(end[k] + (s / total) * GATHERED));

  const carrier = (k: number, t: number) => {
    if (k === 0) return 0;
    const lag = (STAGGER_MS * (n - k)) / Math.max(1, n - 1);
    return rest[k] + (end[k] - rest[k]) * pull((t - lag) / PULL_MS);
  };

  const step = 1000 / 40;
  const frames = Math.ceil(CURTAIN_OPEN_MS / step);
  const times: number[] = [];
  const fold: string[][] = folds.map(() => []);
  const ao: number[][] = folds.map(() => []);
  const shade = folds.map(() => ({ x: [] as string[], o: [] as number[] }));
  const cast = { x: [] as string[], o: [] as number[] };

  // the hem springs, integrated at 1 ms
  const w0 = 2 * Math.PI * 1.05;
  const zeta = 0.66;
  const hem = folds.map((_, k) => (rest[k] + rest[k + 1]) / 2);
  const vel = folds.map(() => 0);
  let t = 0;

  for (let fr = 0; fr <= frames; fr += 1) {
    const target = fr * step;
    while (t < target) {
      for (let k = 0; k < n; k += 1) {
        const mid = (carrier(k, t) + carrier(k + 1, t)) / 2;
        const acc = w0 * w0 * (mid - hem[k]) - 2 * zeta * w0 * vel[k];
        vel[k] += acc * 0.001;
        hem[k] += vel[k] * 0.001;
      }
      t += 1;
    }
    times.push(target);
    for (let k = 0; k < n; k += 1) {
      const l = carrier(k, target);
      const r = carrier(k + 1, target);
      /*
       * How much of this fold still shows between its carriers, and how much
       * of it has gone under its neighbour. A gathered fold is not squeezed to
       * the gap it shows: part of it turns under the fold beside it, which is
       * on top, and only the rest is foreshortened. The leading fold has
       * nothing on top of it, so it can only be foreshortened.
       */
      const gap = (r - l) / widths[k];
      const tucked = k === n - 1 ? 0 : (1 - gap) * 0.45;
      const scale = gap + tucked;
      const dx = (l - rest[k]) * panelW;
      const trail = (hem[k] - (l + r) / 2) * panelW;
      const skew = Math.max(-4, Math.min(4, (Math.atan2(trail, panelH) * 180) / Math.PI));
      const lean = `skewX(${skew.toFixed(3)}deg)`;
      fold[k].push(`translateX(${dx.toFixed(2)}px) ${lean} scaleX(${scale.toFixed(4)})`);
      // gathered cloth is deeper cloth: its valleys close and shade each other
      ao[k].push(Math.min(0.5, Math.max(0, (1 - gap) * 0.55)));
      /*
       * The shade this fold throws onto the one it has slid over: none while
       * the curtain hangs, deepening as the fold beneath disappears under it.
       */
      if (k > 0) {
        const below = (carrier(k, target) - carrier(k - 1, target)) / widths[k - 1];
        shade[k].x.push(`translateX(${dx.toFixed(2)}px) ${lean}`);
        shade[k].o.push(Math.min(0.6, Math.max(0, (1 - below) * 0.85)));
      } else {
        shade[k].x.push("none");
        shade[k].o.push(0);
      }
    }
    const lead = carrier(n, target);
    cast.x.push(`translateX(${((lead - 1) * panelW).toFixed(2)}px)`);
    cast.o.push(0.55 - 0.25 * pull(target / PULL_MS));
  }
  return { times, fold, ao, shade, cast };
}

function Panel({ side, set, open }: { side: Side; set: SetName; open: boolean }) {
  const folds = foldsOf(set, side);
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!open || !el || played.current) return;
    played.current = true;

    const box = el.getBoundingClientRect();
    const p = plan(folds, box.width, box.height, side === "left" ? 17 : 61);
    const offsets = p.times.map((tt) => tt / CURTAIN_OPEN_MS);
    const opts: KeyframeAnimationOptions = { duration: CURTAIN_OPEN_MS, fill: "forwards", easing: "linear" };
    const anims: Animation[] = [];
    const run = (node: Element | null, frames: Keyframe[]) => {
      if (!node || typeof node.animate !== "function") return;
      anims.push(node.animate(frames, opts));
    };
    const nodes = el.querySelectorAll<HTMLElement>("[data-fold]");
    nodes.forEach((node) => {
      const k = Number(node.dataset.fold);
      run(node, p.fold[k].map((transform, i) => ({ transform, offset: offsets[i] })));
      run(node.querySelector(".drape-ao"), p.ao[k].map((opacity, i) => ({ opacity, offset: offsets[i] })));
      run(
        el.querySelector(`[data-shade="${k}"]`),
        p.shade[k].x.map((transform, i) => ({ transform, opacity: p.shade[k].o[i], offset: offsets[i] })),
      );
    });
    run(
      el.querySelector(".drape-cast"),
      p.cast.x.map((transform, i) => ({ transform, opacity: p.cast.o[i], offset: offsets[i] })),
    );

    /*
     * Reduced motion keeps the picture and drops the travel: the curtain is
     * simply drawn, in its final, gathered state, with no movement at all.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      anims.forEach((a) => a.finish());
    }
    return () => anims.forEach((a) => a.cancel());
    // `folds` is derived from `set` and `side`, which are the real inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, set, side]);

  return (
    <div
      ref={ref}
      className={`drape drape-${side}`}
      style={{ "--drape-map": `url(/kit/curtain-${set}-${side}.webp)` } as CSSProperties}
    >
      {folds.map((f, k) => {
        const last = k === folds.length - 1;
        const w = f.x1 - f.x0;
        return (
          <div key={`${set}-${k}`} style={{ display: "contents" }}>
            {k > 0 && (
              <span
                className="drape-shade"
                data-shade={k}
                style={{
                  left: `${((f.a - SHADE_W) * 100).toFixed(3)}%`,
                  width: `${(SHADE_W * 100).toFixed(3)}%`,
                  zIndex: 2 * k + 1,
                }}
              />
            )}
            <div
              className="drape-fold"
              data-fold={k}
              style={
                {
                  left: `${(f.x0 * 100).toFixed(3)}%`,
                  width: `${(w * 100).toFixed(3)}%`,
                  zIndex: 2 * k + 2,
                  clipPath: clipOf(f, k, last),
                  transformOrigin: `${(((f.a - f.x0) / w) * 100).toFixed(2)}% 0`,
                  "--x0": f.x0.toFixed(4),
                } as CSSProperties
              }
            >
              <span className="drape-ao" />
            </div>
          </div>
        );
      })}
      <span className="drape-cast" />
    </div>
  );
}

/**
 * Both panels. The right-hand one is the same construction hung mirrored, so
 * its light also comes from the middle of the stage; it is cut from a
 * different render, so the two never fold alike.
 */
export function Drape({ open }: { open: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = useFoldSet(ref);
  return (
    <div ref={ref} className="drape-set">
      <Panel side="left" set={set} open={open} />
      <Panel side="right" set={set} open={open} />
    </div>
  );
}

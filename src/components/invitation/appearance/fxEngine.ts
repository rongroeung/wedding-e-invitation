/**
 * The live layer, drawn on a canvas.
 *
 * What it draws, back to front:
 *
 *   light    two or three pools of warm light drifting slowly over the
 *            sheet, and now and then a soft band of light passing across it,
 *            as through a window (Romantic Glow, Full).
 *   bokeh    a few large, soft, out-of-focus motes of gold close to the eye,
 *            each with the brighter rim a real lens gives them.
 *   shadows  each petal's soft shadow, cast on the paper below it.
 *   dust     fine gold specks at many depths: nearer ones larger, brighter
 *            and faster; each one turns in the light, so it twinkles.
 *   petals   rose petals, shaded and veined, that fall, sway and tumble in
 *            three dimensions (their width follows the cosine of the turn,
 *            and the back of a petal is a shade deeper than its face).
 *   glints   now and then a speck catches the light and flares into a
 *            four-pointed star.
 *
 * Colours follow the paper: on a light sheet the gold is a metal (a darker
 * body with a bright point) so it shows on ivory; on burgundy it is light.
 *
 * Everything is pre-rendered once into small sprites and drawn with
 * `drawImage`, so a frame is a few hundred blits at most. The loop sleeps
 * while the tab is hidden, and the device pixel ratio is capped.
 */

import { DARK_PAPERS, type FxLevel, type FxMode, type PaperTheme } from "@/lib/appearance";

import {
  blossomLayer,
  butterflyLayer,
  type Env,
  fireflyLayer,
  goldLeafLayer,
  type Layer,
  rgba,
  type Rgb,
  starLayer,
  sunbeamLayer,
} from "./fxModes";

export type FxOptions = {
  fx: FxMode;
  level: FxLevel;
  paper: PaperTheme;
  rich: boolean;
  /** Force the dark (light-emitting) palette, e.g. in the envelope's room. */
  tone?: "dark";
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── palettes ─────────────────────────────────────────────────────────── */

type Palette = {
  dark: boolean;
  goldBody: Rgb;
  goldLight: Rgb;
  glintRay: Rgb;
  bokeh: Rgb;
  pool: Rgb;
  band: Rgb;
  petals: { face: [Rgb, Rgb, Rgb]; back: [Rgb, Rgb] }[];
  shadow: number;
};

const ROSE = { face: [[252, 226, 226], [240, 184, 188], [214, 132, 142]] as [Rgb, Rgb, Rgb], back: [[236, 196, 198], [196, 118, 128]] as [Rgb, Rgb] };
const BLUSH = { face: [[255, 240, 236], [246, 208, 204], [226, 164, 166]] as [Rgb, Rgb, Rgb], back: [[240, 214, 210], [212, 154, 156]] as [Rgb, Rgb] };
const IVORY = { face: [[255, 252, 244], [248, 236, 214], [226, 200, 160]] as [Rgb, Rgb, Rgb], back: [[240, 228, 206], [208, 180, 140]] as [Rgb, Rgb] };
const DEEP_ROSE = { face: [[246, 200, 204], [222, 140, 152], [176, 76, 96]] as [Rgb, Rgb, Rgb], back: [[220, 162, 170], [160, 70, 88]] as [Rgb, Rgb] };
const CHAMPAGNE = { face: [[255, 246, 226], [242, 216, 168], [208, 166, 98]] as [Rgb, Rgb, Rgb], back: [[236, 214, 172], [190, 148, 86]] as [Rgb, Rgb] };

function palette(paper: PaperTheme, tone?: "dark"): Palette {
  if (tone === "dark" || DARK_PAPERS.includes(paper)) {
    return {
      dark: true,
      goldBody: [236, 198, 120],
      goldLight: [255, 246, 222],
      glintRay: [255, 238, 204],
      bokeh: [255, 214, 160],
      pool: [255, 196, 160],
      band: [255, 222, 190],
      petals: [CHAMPAGNE, BLUSH, CHAMPAGNE],
      shadow: 0.34,
    };
  }
  const blush = paper === "romantic-blush";
  return {
    dark: false,
    goldBody: blush ? [214, 150, 124] : [212, 166, 82],
    goldLight: [255, 250, 236],
    glintRay: blush ? [232, 168, 136] : [230, 180, 86],
    bokeh: blush ? [255, 222, 210] : [255, 232, 176],
    pool: [255, 246, 226],
    band: [255, 250, 236],
    petals: blush ? [DEEP_ROSE, ROSE, IVORY] : [ROSE, BLUSH, IVORY],
    shadow: 0.16,
  };
}

/* ── sprites ──────────────────────────────────────────────────────────── */

function sprite(size: number, draw: (c: CanvasRenderingContext2D, s: number) => void) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const c = cv.getContext("2d")!;
  draw(c, size);
  return cv;
}

function speckSprite(p: Palette) {
  // a bright metal flake with a soft halo of its own light around it
  return sprite(48, (c, s) => {
    const g = c.createRadialGradient(s * 0.47, s * 0.45, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, rgba(p.goldLight, 1));
    g.addColorStop(0.1, rgba(p.goldLight, 1));
    g.addColorStop(0.2, rgba(p.goldBody, 1));
    g.addColorStop(0.3, rgba(p.goldBody, 0.55));
    g.addColorStop(0.55, rgba(p.goldBody, p.dark ? 0.16 : 0.14));
    g.addColorStop(1, rgba(p.goldBody, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  });
}

function bokehSprite(p: Palette) {
  return sprite(96, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, rgba(p.bokeh, 0.42));
    g.addColorStop(0.62, rgba(p.bokeh, 0.34));
    g.addColorStop(0.84, rgba(p.bokeh, 0.6)); // the brighter rim of a real out-of-focus highlight
    g.addColorStop(0.93, rgba(p.bokeh, 0.25));
    g.addColorStop(1, rgba(p.bokeh, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  });
}

function glintSprite(p: Palette) {
  return sprite(128, (c, s) => {
    const m = s / 2;
    c.globalCompositeOperation = "lighter";
    const ray = (ang: number, len: number, thick: number, a: number) => {
      c.save();
      c.translate(m, m);
      c.rotate(ang);
      c.scale(1, thick);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, len);
      g.addColorStop(0, rgba(p.goldLight, a));
      g.addColorStop(0.25, rgba(p.glintRay, a * 0.7));
      g.addColorStop(1, rgba(p.glintRay, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, len, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };
    ray(0, m, 0.05, 1);
    ray(Math.PI / 2, m, 0.05, 1);
    ray(Math.PI / 4, m * 0.5, 0.06, 0.6);
    ray(-Math.PI / 4, m * 0.5, 0.06, 0.6);
    const core = c.createRadialGradient(m, m, 0, m, m, m * 0.28);
    core.addColorStop(0, rgba([255, 255, 255], 1));
    core.addColorStop(0.3, rgba(p.goldLight, 0.8));
    core.addColorStop(1, rgba(p.glintRay, 0));
    c.fillStyle = core;
    c.fillRect(0, 0, s, s);
  });
}

function petalPath(c: CanvasRenderingContext2D, w: number, h: number) {
  // a rose petal: narrow at its base (bottom), broad and softly notched at
  // its outer edge (top)
  c.beginPath();
  c.moveTo(0, h / 2);
  c.bezierCurveTo(w * 0.58, h * 0.32, w * 0.66, -h * 0.22, w * 0.2, -h * 0.47);
  c.quadraticCurveTo(w * 0.04, -h * 0.4, 0, -h * 0.42);
  c.quadraticCurveTo(-w * 0.04, -h * 0.4, -w * 0.2, -h * 0.47);
  c.bezierCurveTo(-w * 0.66, -h * 0.22, -w * 0.58, h * 0.32, 0, h / 2);
  c.closePath();
}

const PETAL_SPRITE = 112;
const PETAL_W = 66;
const PETAL_H = 80;

function petalSprite(tone: Palette["petals"][number], face: boolean) {
  return sprite(PETAL_SPRITE, (c, s) => {
    c.translate(s / 2, s / 2);
    const [edge, mid, base] = face ? tone.face : [tone.back[0], tone.back[0], tone.back[1]];
    petalPath(c, PETAL_W, PETAL_H);
    const g = c.createRadialGradient(0, -PETAL_H * 0.25, 2, 0, PETAL_H * 0.1, PETAL_H * 0.72);
    g.addColorStop(0, rgba(edge, 1));
    g.addColorStop(0.55, rgba(mid, 1));
    g.addColorStop(1, rgba(base, 1));
    c.fillStyle = g;
    c.fill();
    c.save();
    c.clip();
    // the petal is cupped: one side turned from the light, the other catching it
    const cup = c.createLinearGradient(-PETAL_W / 2, 0, PETAL_W / 2, 0);
    cup.addColorStop(0, "rgba(90,30,40,0.22)");
    cup.addColorStop(0.42, "rgba(90,30,40,0)");
    cup.addColorStop(0.7, "rgba(255,255,255,0.22)");
    cup.addColorStop(1, "rgba(255,255,255,0.05)");
    c.fillStyle = cup;
    c.fillRect(-s / 2, -s / 2, s, s);
    // a deeper flush at the base, where a petal joins the flower
    const flush = c.createRadialGradient(0, PETAL_H * 0.5, 0, 0, PETAL_H * 0.5, PETAL_H * 0.42);
    flush.addColorStop(0, rgba(base, 0.55));
    flush.addColorStop(1, rgba(base, 0));
    c.fillStyle = flush;
    c.fillRect(-s / 2, -s / 2, s, s);
    // fine veins fanning from the base
    c.strokeStyle = face ? "rgba(255,255,255,0.22)" : "rgba(120,50,60,0.12)";
    c.lineWidth = 0.6;
    for (let i = -3; i <= 3; i++) {
      c.beginPath();
      c.moveTo(0, PETAL_H * 0.46);
      c.quadraticCurveTo(i * PETAL_W * 0.06, 0, i * PETAL_W * 0.11, -PETAL_H * 0.4);
      c.stroke();
    }
    c.restore();
    // a translucent rim, where the light comes through the edge
    petalPath(c, PETAL_W, PETAL_H);
    c.strokeStyle = face ? "rgba(255,250,248,0.55)" : "rgba(255,240,236,0.25)";
    c.lineWidth = 1.1;
    c.stroke();
  });
}

function petalShadowSprite() {
  return sprite(PETAL_SPRITE, (c, s) => {
    // draw the silhouette far off the sprite and keep only its blurred
    // shadow, which works in every browser (no canvas `filter` needed)
    c.shadowColor = "rgba(40,16,10,1)";
    c.shadowBlur = 9;
    c.shadowOffsetX = s * 4;
    c.translate(s / 2 - s * 4, s / 2);
    petalPath(c, PETAL_W * 0.96, PETAL_H * 0.96);
    c.fillStyle = "#000";
    c.fill();
  });
}

/* ── the scene ────────────────────────────────────────────────────────── */

const LEVEL = { low: 0.55, medium: 1, high: 1.6 } as const;

type Speck = { x: number; y: number; z: number; ph: number; tw: number; sway: number };
type Bokeh = { x: number; y: number; r: number; a: number; ph: number; vy: number };
type Petal = {
  x: number; y: number; z: number; theta: number; spin: number; phi: number; flip: number;
  sway: number; swayF: number; ph: number; fall: number; tone: number;
};
type Glint = { x: number; y: number; t: number; dur: number; size: number; rot: number };

export function startFx(canvas: HTMLCanvasElement, opts: FxOptions): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const pal = palette(opts.paper, opts.tone);
  const k = LEVEL[opts.level] * (opts.rich ? 1 : 0.55);
  const { fx } = opts;
  const full = fx === "full";

  // the base populations, and how much of each the newer scenes borrow
  // sparse: the printed artwork is the main thing to look at, the motion only
  // accompanies it (a few specks of dust, two or three soft motes at most)
  const SPECKS: Partial<Record<FxMode, number>> = { dust: 44, full: 34, glow: 20, butterflies: 12, goldleaf: 16, blossoms: 8 };
  const BOKEH: Partial<Record<FxMode, number>> = { dust: 3, full: 3, glow: 4, butterflies: 2, blossoms: 2, fireflies: 2, sunbeams: 2 };
  const GLINTS: Partial<Record<FxMode, number>> = { dust: 0.8, full: 0.7, glow: 0.45, goldleaf: 0.5, butterflies: 0.25 };
  const nSpeck = Math.round((SPECKS[fx] ?? 0) * k);
  const nBokeh = Math.round((BOKEH[fx] ?? 0) * Math.min(k, 1.3));
  const nPetal = fx === "petals" ? Math.max(2, Math.round(9 * k)) : full ? Math.max(2, Math.round(5 * k)) : 0;
  const glintRate = (GLINTS[fx] ?? 0) * k; // per second
  const light = fx === "glow" || full;
  const lightK = { low: 0.65, medium: 0.9, high: 1.15 }[opts.level];

  canvas.dataset.specks = String(nSpeck);
  canvas.dataset.bokeh = String(nBokeh);
  canvas.dataset.petals = String(nPetal);
  canvas.dataset.light = light ? "1" : "0";

  const speck = speckSprite(pal);
  const bokehImg = bokehSprite(pal);
  const glintImg = glintSprite(pal);
  const petalFaces = pal.petals.map((t) => petalSprite(t, true));
  const petalBacks = pal.petals.map((t) => petalSprite(t, false));
  const shadowImg = petalShadowSprite();
  const lightCv = document.createElement("canvas");
  const lctx = lightCv.getContext("2d")!;

  const r = rng(20271);
  let W = 0;
  let H = 0;
  let dpr = 1;

  // the newer scenes (fxModes), sharing this scene's size, palette and rng
  const env: Env = { W: 0, H: 0, dark: pal.dark, k, lightK, r, gold: pal.goldBody, goldLight: pal.goldLight };
  const extra: Layer | null =
    fx === "butterflies" ? butterflyLayer(env)
    : fx === "fireflies" ? fireflyLayer(env)
    : fx === "blossoms" ? blossomLayer(env)
    : fx === "goldleaf" ? goldLeafLayer(env)
    : fx === "starlight" ? starLayer(env, glintImg)
    : fx === "sunbeams" ? sunbeamLayer(env, speck)
    : null;
  if (extra) for (const [key, v] of Object.entries(extra.counts)) canvas.dataset[key] = String(v);

  const specks: Speck[] = [];
  const bokehs: Bokeh[] = [];
  const petals: Petal[] = [];
  const glints: Glint[] = [];

  const newPetal = (p: Partial<Petal> = {}): Petal => {
    const z = 0.45 + r() * 0.6;
    return {
      x: r() * W,
      y: -40 - r() * H * 0.3,
      z,
      theta: r() * Math.PI * 2,
      spin: (r() - 0.5) * 1.1,
      phi: r() * Math.PI * 2,
      flip: (0.6 + r() * 1.4) * (r() < 0.5 ? -1 : 1),
      sway: 18 + r() * 36,
      swayF: 0.25 + r() * 0.3,
      ph: r() * Math.PI * 2,
      fall: 24 + z * 26 + r() * 10,
      tone: Math.floor(r() * pal.petals.length),
      ...p,
    };
  };

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    const nw = Math.max(1, Math.round(box.width));
    const nh = Math.max(1, Math.round(box.height));
    dpr = Math.min(window.devicePixelRatio || 1, opts.rich ? 2 : 1.5);
    canvas.width = Math.round(nw * dpr);
    canvas.height = Math.round(nh * dpr);
    const first = W === 0;
    W = nw;
    H = nh;
    env.W = W;
    env.H = H;
    if (first) {
      extra?.seed();
      for (let i = 0; i < nSpeck; i++) {
        specks.push({ x: r() * W, y: r() * H, z: Math.pow(r(), 1.6), ph: r() * 100, tw: 0.6 + r() * 2.2, sway: r() * 100 });
      }
      for (let i = 0; i < nBokeh; i++) {
        bokehs.push({ x: r() * W, y: r() * H, r: 10 + r() * 26, a: 0.35 + r() * 0.45, ph: r() * 100, vy: 3 + r() * 6 });
      }
      for (let i = 0; i < nPetal; i++) petals.push(newPetal({ y: r() * H }));
    }
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let raf = 0;
  let last = performance.now();
  let t = 0;
  let frames = 0;
  let nextGlint = 0.6;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    frames++;
    if (frames % 30 === 0) canvas.dataset.frames = String(frames);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* light: painted at an eighth of the size (it is all soft gradients)
       and scaled up, so it costs a few hundred pixels, not the screen */
    if (light) {
      const lw = Math.max(8, Math.ceil(W / 8));
      const lh = Math.max(8, Math.ceil(H / 8));
      if (lightCv.width !== lw || lightCv.height !== lh) {
        lightCv.width = lw;
        lightCv.height = lh;
      }
      lctx.clearRect(0, 0, lw, lh);
      const pools = [
        [0.3 + 0.18 * Math.sin(t * 0.05), 0.28 + 0.12 * Math.cos(t * 0.04), 0.62, 0.32],
        [0.72 + 0.14 * Math.cos(t * 0.045 + 1), 0.62 + 0.14 * Math.sin(t * 0.035 + 2), 0.55, 0.24],
        [0.5 + 0.25 * Math.sin(t * 0.03 + 4), 0.9 + 0.06 * Math.sin(t * 0.05), 0.5, 0.18],
      ];
      for (const [px, py, pr, pa] of pools) {
        const R = Math.max(lw, lh) * pr;
        const g = lctx.createRadialGradient(px * lw, py * lh, 0, px * lw, py * lh, R);
        const a = pa * lightK * (pal.dark ? 0.32 : 0.8);
        g.addColorStop(0, rgba(pal.pool, a));
        g.addColorStop(0.5, rgba(pal.pool, a * 0.4));
        g.addColorStop(1, rgba(pal.pool, 0));
        lctx.fillStyle = g;
        lctx.fillRect(0, 0, lw, lh);
      }
      // a soft band of light passing across the sheet every 16 seconds
      const cycle = (t % 16) / 16;
      if (cycle < 0.45) {
        const s = cycle / 0.45;
        const bx = -0.6 * lw + s * 2.2 * lw;
        const g = lctx.createLinearGradient(bx - lw * 0.35, 0, bx + lw * 0.35, lh * 0.6);
        const a = Math.sin(s * Math.PI) * (pal.dark ? 0.1 : 0.32) * lightK;
        g.addColorStop(0, rgba(pal.band, 0));
        g.addColorStop(0.5, rgba(pal.band, a));
        g.addColorStop(1, rgba(pal.band, 0));
        lctx.fillStyle = g;
        lctx.fillRect(0, 0, lw, lh);
      }
      ctx.globalCompositeOperation = pal.dark ? "lighter" : "source-over";
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(lightCv, 0, 0, W, H);
    }

    /* bokeh: the nearest motes, out of focus */
    ctx.globalCompositeOperation = pal.dark ? "lighter" : "source-over";
    for (const b of bokehs) {
      b.y -= b.vy * dt;
      b.x += Math.sin(t * 0.2 + b.ph) * 4 * dt;
      if (b.y < -b.r * 2) {
        b.y = H + b.r * 2;
        b.x = r() * W;
      }
      const breathe = 0.75 + 0.25 * Math.sin(t * 0.5 + b.ph);
      ctx.globalAlpha = b.a * breathe * (pal.dark ? 0.55 : 0.75);
      ctx.drawImage(bokehImg, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }

    /* petals move; their shadows go down first, on the paper */
    ctx.globalCompositeOperation = "source-over";
    for (const p of petals) {
      const edge = Math.abs(Math.cos(p.phi));
      p.y += p.fall * (1.25 - 0.45 * edge) * dt; // edge-on, a petal slices down faster
      p.x += (Math.cos(t * p.swayF + p.ph) * p.sway * p.swayF + Math.sin(t * 0.13 + p.ph) * 6) * dt;
      p.theta += p.spin * dt;
      p.phi += p.flip * dt;
      if (p.y > H + 60) Object.assign(p, newPetal());
    }
    for (const p of petals) {
      const s = 0.42 * p.z;
      const sx = Math.max(0.08, Math.abs(Math.cos(p.phi)));
      const off = 6 + 10 * p.z;
      ctx.save();
      ctx.translate(p.x + off * 0.7, p.y + off);
      ctx.rotate(p.theta);
      ctx.scale(sx * s * 1.05, s * 1.05);
      ctx.globalAlpha = pal.shadow * (0.5 + 0.5 * sx);
      ctx.drawImage(shadowImg, -PETAL_SPRITE / 2, -PETAL_SPRITE / 2);
      ctx.restore();
    }

    /* dust */
    ctx.globalCompositeOperation = pal.dark ? "lighter" : "source-over";
    for (const d of specks) {
      const near = d.z;
      d.y -= (5 + near * 16) * dt;
      d.x += (Math.sin(t * 0.3 + d.sway) * (4 + near * 8) + Math.sin(d.y * 0.01 + t * 0.2) * 3) * dt;
      if (d.y < -6) {
        d.y = H + 6;
        d.x = r() * W;
      }
      if (d.x < -6) d.x = W + 6;
      if (d.x > W + 6) d.x = -6;
      // a flake turning in the light: mostly dim, briefly bright
      const turn = 0.5 + 0.5 * Math.sin(t * d.tw + d.ph);
      const flash = Math.pow(turn, 6);
      const size = (1.6 + near * 4.4) * 2.4 + flash * 4;
      ctx.globalAlpha = Math.min(1, (0.3 + near * 0.45) * (0.45 + 0.55 * turn) + flash * 0.4);
      ctx.drawImage(speck, d.x - size / 2, d.y - size / 2, size, size);
    }

    /* petals themselves */
    ctx.globalCompositeOperation = "source-over";
    for (const p of petals) {
      const c = Math.cos(p.phi);
      const sx = Math.max(0.08, Math.abs(c));
      const s = 0.42 * p.z;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.theta);
      // a whisper of perspective: the receding edge leans
      ctx.transform(1, 0, Math.sin(p.phi) * 0.12, 1, 0, 0);
      ctx.scale(sx * s, s);
      ctx.globalAlpha = 0.72 + 0.28 * sx;
      ctx.drawImage(c >= 0 ? petalFaces[p.tone] : petalBacks[p.tone], -PETAL_SPRITE / 2, -PETAL_SPRITE / 2);
      ctx.restore();
    }

    /* the newer scenes draw above the dust and petals */
    if (extra) {
      extra.frame(ctx, dt, t);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    /* glints */
    nextGlint -= dt;
    if (glintRate > 0 && nextGlint <= 0) {
      nextGlint = (0.4 + r() * 1.2) / glintRate;
      const host = specks.length ? specks[Math.floor(r() * specks.length)] : null;
      glints.push({
        x: host ? host.x : r() * W,
        y: host ? host.y : r() * H,
        t: 0,
        dur: 0.55 + r() * 0.5,
        size: 24 + r() * 30,
        rot: (r() - 0.5) * 0.5,
      });
    }
    ctx.globalCompositeOperation = pal.dark ? "lighter" : "source-over";
    for (let i = glints.length - 1; i >= 0; i--) {
      const g = glints[i];
      g.t += dt;
      const u = g.t / g.dur;
      if (u >= 1) {
        glints.splice(i, 1);
        continue;
      }
      const env = Math.sin(Math.PI * u) ** 2;
      const size = g.size * (0.5 + 0.5 * env);
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot + u * 0.4);
      ctx.globalAlpha = env;
      ctx.drawImage(glintImg, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", onVis);
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}

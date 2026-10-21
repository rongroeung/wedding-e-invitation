/**
 * The six newer scenes of the live layer, composed by `fxEngine`:
 *
 *   butterflies  real flight: wingbeats with the body lifting on each
 *                downstroke, glides with the wings held open, wandering turns,
 *                and now and then a landing — wings slowly opening and closing
 *                — before taking off again. Wings are drawn from above and
 *                fold toward the body in 3D (their width follows the cosine of
 *                the wing angle); the scales catch the light at one angle of
 *                the beat; a soft shadow follows on the paper, closer and
 *                sharper when the butterfly settles.
 *   fireflies    warm points that drift and blink the way fireflies do: a
 *                quick swell, a glow, a slower fade, a dark interval.
 *   blossoms     whole frangipani and jasmine flowers falling, spinning and
 *                tumbling in 3D with their shadows.
 *   goldleaf     crinkled flakes of gold leaf turning as they fall, flashing
 *                when a facet meets the light.
 *   starlight    a field of stars at many depths, scintillating, and now and
 *                then a shooting star.
 *   sunbeams     soft shafts of light falling from the upper left, breathing,
 *                with motes that brighten as they cross a shaft.
 */

export type Rgb = [number, number, number];
export const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export type Env = {
  W: number;
  H: number;
  dark: boolean;
  k: number; // count multiplier from intensity and device
  lightK: number;
  r: () => number;
  gold: Rgb;
  goldLight: Rgb;
};

export type Layer = {
  counts: Record<string, number>;
  /** Called on resize; the first call with a real size seeds the scene. */
  seed: () => void;
  frame: (ctx: CanvasRenderingContext2D, dt: number, t: number) => void;
};

function sprite(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  return cv;
}

function shadowOf(w: number, h: number, path: (c: CanvasRenderingContext2D) => void, blur: number) {
  return sprite(w, h, (c) => {
    c.shadowColor = "rgba(40,18,10,1)";
    c.shadowBlur = blur;
    c.shadowOffsetX = w * 4;
    c.translate(-w * 4, 0);
    path(c);
    c.fillStyle = "#000";
    c.fill();
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * Butterflies
 * ════════════════════════════════════════════════════════════════════════ */

type Species = { base: Rgb; mid: Rgb; light: Rgb; margin: Rgb; spot: Rgb; eye: Rgb };

const SPECIES_LIGHT: Species[] = [
  // a golden swallowtail: cream gold with a dark margin and pale spots
  { base: [96, 62, 22], mid: [226, 176, 86], light: [250, 228, 168], margin: [52, 34, 18], spot: [255, 246, 222], eye: [196, 70, 52] },
  // a rose-pink jezebel
  { base: [120, 58, 66], mid: [232, 150, 156], light: [252, 220, 214], margin: [62, 30, 36], spot: [255, 240, 236], eye: [230, 180, 70] },
  // a pale blue, shimmering
  { base: [36, 62, 112], mid: [104, 156, 218], light: [206, 228, 248], margin: [24, 34, 60], spot: [244, 250, 255], eye: [240, 190, 90] },
];
const SPECIES_DARK: Species[] = [
  { base: [140, 98, 40], mid: [240, 200, 120], light: [255, 240, 200], margin: [70, 48, 22], spot: [255, 250, 230], eye: [210, 90, 70] },
  { base: [150, 86, 92], mid: [246, 186, 186], light: [255, 232, 226], margin: [80, 40, 46], spot: [255, 246, 242], eye: [240, 200, 100] },
  { base: [60, 100, 170], mid: [140, 196, 250], light: [222, 240, 255], margin: [30, 44, 80], spot: [250, 252, 255], eye: [250, 210, 110] },
];

const WING = 112; // sprite size (one side: forewing and hindwing)

function forewing(c: CanvasRenderingContext2D) {
  c.beginPath();
  c.moveTo(2, -4);
  c.bezierCurveTo(14, -30, 40, -50, 62, -50);
  c.bezierCurveTo(72, -48, 74, -40, 70, -30);
  c.bezierCurveTo(64, -16, 46, -4, 8, 2);
  c.closePath();
}
function hindwing(c: CanvasRenderingContext2D) {
  c.beginPath();
  c.moveTo(4, 2);
  c.bezierCurveTo(30, -2, 54, 6, 56, 22);
  c.bezierCurveTo(57, 36, 46, 48, 38, 50);
  c.lineTo(36, 60); // the tail
  c.lineTo(31, 50);
  c.bezierCurveTo(20, 50, 8, 34, 4, 14);
  c.closePath();
}

function wingSprite(sp: Species, under: boolean) {
  // drawn for the right side, the body along x = 0, the head up
  return sprite(WING, WING, (c) => {
    c.translate(2, WING / 2);
    const dim = under ? 0.78 : 1;
    const col = (rgb: Rgb, a = 1) => rgba([rgb[0] * dim, rgb[1] * dim, rgb[2] * dim].map(Math.round) as Rgb, a);
    for (const [shape, cx, cy, R] of [
      [hindwing, 6, 6, 62],
      [forewing, 4, -4, 76],
    ] as const) {
      c.save();
      shape(c);
      const g = c.createRadialGradient(cx, cy, 2, cx, cy, R);
      g.addColorStop(0, col(sp.base));
      g.addColorStop(0.28, col(sp.mid));
      g.addColorStop(0.7, col(sp.light));
      g.addColorStop(1, col(sp.mid));
      c.fillStyle = g;
      c.fill();
      c.clip();
      // the dark margin, deepening toward the edge, and the pale spots in it
      shape(c);
      c.lineWidth = 14;
      c.strokeStyle = col(sp.margin, 0.22);
      c.stroke();
      shape(c);
      c.lineWidth = 6;
      c.strokeStyle = col(sp.margin, 0.72);
      c.stroke();
      // scales: a fine, uneven grain of light and dark across the wing
      for (let i = 0; i < 220; i++) {
        const x = Math.random() * 74;
        const y = (Math.random() - 0.5) * 112;
        c.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
        c.fillRect(x, y, 1.2, 1.2);
      }
      // veins fanning from the root
      c.strokeStyle = col(sp.margin, 0.38);
      c.lineWidth = 0.55;
      const veins = shape === forewing ? [[60, -48], [70, -36], [66, -24], [52, -12], [34, -4]] : [[54, 14], [52, 30], [40, 46], [24, 44], [12, 30]];
      for (const [vx, vy] of veins) {
        c.beginPath();
        c.moveTo(cx, cy);
        c.quadraticCurveTo((cx + vx) / 2 + 4, (cy + vy) / 2 - 4, vx, vy);
        c.stroke();
      }
      c.restore();
    }
    // spots along the margins
    c.fillStyle = col(sp.spot, 0.9);
    for (const [x, y, r] of [[64, -42, 2], [69, -33, 1.8], [66, -24, 1.6], [58, -16, 1.4], [52, 22, 1.8], [50, 32, 1.6], [42, 42, 1.5]]) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
    // an eyespot on the hindwing
    if (!under) {
      c.fillStyle = col(sp.margin);
      c.beginPath();
      c.arc(40, 30, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = col(sp.eye);
      c.beginPath();
      c.arc(40, 30, 2.8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.9)";
      c.beginPath();
      c.arc(39, 29, 1.1, 0, Math.PI * 2);
      c.fill();
    }
    // a translucent edge
    for (const shape of [forewing, hindwing]) {
      shape(c);
      c.lineWidth = 0.6;
      c.strokeStyle = "rgba(255,255,255,0.22)";
      c.stroke();
    }
  });
}

function butterflyShadow() {
  return shadowOf(WING * 2, WING, (c) => {
    c.translate(WING, WING / 2);
    for (const s of [1, -1]) {
      c.save();
      c.scale(s, 1);
      forewing(c);
      c.fill();
      hindwing(c);
      c.restore();
    }
  }, 8);
}

type Fly = {
  x: number; y: number; h: number; v: number; size: number; sp: number;
  phase: number; freq: number; mode: "fly" | "glide" | "perch" | "land";
  timer: number; turn: number; tx: number; ty: number; alt: number; gl: number;
};

export function butterflyLayer(env: Env): Layer {
  const n = Math.max(2, Math.round(4 * env.k));
  const species = env.dark ? SPECIES_DARK : SPECIES_LIGHT;
  const faces = species.map((s) => wingSprite(s, false));
  const unders = species.map((s) => wingSprite(s, true));
  const shadow = butterflyShadow();
  const flies: Fly[] = [];
  const { r } = env;

  const pickTarget = (f: Fly) => {
    f.tx = env.W * (0.12 + r() * 0.76);
    f.ty = env.H * (0.12 + r() * 0.76);
  };

  return {
    counts: { butterflies: n },
    seed() {
      for (let i = 0; i < n; i++) {
        const f: Fly = {
          x: r() * env.W, y: r() * env.H, h: r() * Math.PI * 2, v: 46 + r() * 30,
          size: 0.32 + r() * 0.2, sp: i % species.length, phase: r() * 10, freq: 7 + r() * 3,
          mode: "fly", timer: 3 + r() * 6, turn: 0, tx: 0, ty: 0, alt: 1, gl: 0,
        };
        pickTarget(f);
        flies.push(f);
      }
    },
    frame(ctx, dt, t) {
      for (const f of flies) {
        f.timer -= dt;
        if (f.mode === "perch") {
          f.alt = Math.max(0, f.alt - dt * 2);
          f.phase += dt * 2 * Math.PI * 0.35;
          if (f.timer <= 0) {
            f.mode = "fly";
            f.timer = 4 + r() * 6;
            pickTarget(f);
          }
        } else {
          f.alt = Math.min(1, f.alt + dt * 2);
          // wander: a smoothly changing turn, steering toward a target
          const want = Math.atan2(f.ty - f.y, f.tx - f.x);
          let d = want - f.h;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          f.turn += ((Math.sin(t * 1.3 + f.phase) * 1.4 + d * 1.6) - f.turn) * Math.min(1, dt * 3);
          f.h += f.turn * dt;
          // now and then a short glide on open wings
          if (f.mode === "fly" && r() < dt * 0.35) {
            f.mode = "glide";
            f.gl = 0.35 + r() * 0.45;
          }
          if (f.mode === "glide") {
            f.gl -= dt;
            if (f.gl <= 0) f.mode = "fly";
          }
          const speed = f.mode === "glide" ? f.v * 0.8 : f.v;
          f.x += Math.cos(f.h) * speed * dt;
          f.y += Math.sin(f.h) * speed * dt;
          if (f.mode !== "land") f.phase += dt * 2 * Math.PI * f.freq;
          const dist = Math.hypot(f.tx - f.x, f.ty - f.y);
          if (f.mode === "fly" && f.timer <= 0) f.mode = "land";
          if (f.mode === "land") {
            f.phase += dt * 2 * Math.PI * f.freq * 0.7;
            if (dist < 8) {
              f.mode = "perch";
              f.timer = 2.5 + r() * 4;
            }
          } else if (dist < 30) {
            pickTarget(f);
          }
        }

        // the wing angle: 0 open flat, toward pi/2 folded up over the back
        const a =
          f.mode === "perch"
            ? 0.75 + 0.62 * Math.sin(f.phase)
            : f.mode === "glide"
              ? 0.22 + 0.05 * Math.sin(t * 6)
              : 0.7 + 0.62 * Math.sin(f.phase);
        const open = Math.max(0.05, Math.cos(a));
        // each downstroke lifts the body a little
        const bob = f.mode === "perch" ? 0 : Math.cos(f.phase) * 2.2;
        const heading = f.h;
        const S = f.size;

        // the shadow, cast down and to the right; further and softer in the air
        const off = 4 + f.alt * 16;
        ctx.save();
        ctx.translate(f.x + off * 0.8, f.y + off + bob);
        ctx.rotate(heading + Math.PI / 2);
        ctx.scale(S * (0.3 + 0.7 * open) * (1 + f.alt * 0.1), S * (1 + f.alt * 0.1));
        ctx.globalAlpha = (env.dark ? 0.3 : 0.16) * (1 - f.alt * 0.35);
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(shadow, -WING, -WING / 2);
        ctx.restore();

        ctx.save();
        ctx.translate(f.x, f.y + bob);
        ctx.rotate(heading + Math.PI / 2);
        ctx.scale(S, S);
        const face = Math.sin(a) < 0.92 ? faces[f.sp] : unders[f.sp];
        for (const side of [1, -1]) {
          ctx.save();
          ctx.scale(side * open, 1);
          ctx.globalAlpha = 0.96;
          ctx.drawImage(face, -2, -WING / 2);
          // the scales flash when the wing passes the angle of the light
          const flash = Math.pow(Math.max(0, Math.cos((a - 0.45) * 3)), 10);
          if (flash > 0.02) {
            ctx.globalAlpha = flash * 0.35;
            ctx.globalCompositeOperation = "lighter";
            ctx.drawImage(face, -2, -WING / 2);
            ctx.globalCompositeOperation = "source-over";
          }
          ctx.restore();
        }
        // the body: thorax, abdomen, head and antennae
        ctx.globalAlpha = 1;
        ctx.fillStyle = env.dark ? "#3a2a1c" : "#2e2116";
        ctx.beginPath();
        ctx.ellipse(0, 4, 2.4, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = env.dark ? "#5a4430" : "#4a3624";
        ctx.beginPath();
        ctx.ellipse(0, -8, 3.1, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -15.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = env.dark ? "#6a523a" : "#3a2a1c";
        ctx.lineWidth = 0.9;
        for (const side of [1, -1]) {
          ctx.beginPath();
          ctx.moveTo(side * 1, -18);
          ctx.quadraticCurveTo(side * 6, -30, side * 10, -36);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(side * 10, -36, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════
 * Fireflies
 * ════════════════════════════════════════════════════════════════════════ */

type Firefly = { x: number; y: number; vx: number; vy: number; ph: number; period: number; on: number; z: number };

export function fireflyLayer(env: Env): Layer {
  const n = Math.round(16 * env.k);
  const core: Rgb = env.dark ? [255, 244, 170] : [255, 226, 120];
  const halo: Rgb = env.dark ? [214, 236, 120] : [240, 196, 80];
  const glow = sprite(96, 96, (c) => {
    const g = c.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, rgba([255, 255, 240], 1));
    g.addColorStop(0.08, rgba(core, 1));
    g.addColorStop(0.22, rgba(halo, 0.55));
    g.addColorStop(0.5, rgba(halo, 0.16));
    g.addColorStop(1, rgba(halo, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 96, 96);
  });
  const flies: Firefly[] = [];
  const { r } = env;
  return {
    counts: { fireflies: n },
    seed() {
      for (let i = 0; i < n; i++) {
        flies.push({ x: r() * env.W, y: r() * env.H, vx: 0, vy: 0, ph: r() * 10, period: 2.4 + r() * 3, on: r(), z: 0.4 + r() * 0.6 });
      }
    },
    frame(ctx, dt, t) {
      ctx.globalCompositeOperation = env.dark ? "lighter" : "source-over";
      for (const f of flies) {
        // a lazy, wandering drift
        f.vx += (Math.sin(t * 0.7 + f.ph * 3) * 14 - f.vx) * dt * 0.8;
        f.vy += (Math.cos(t * 0.53 + f.ph * 2) * 10 - 3 - f.vy) * dt * 0.8;
        f.x += f.vx * dt * f.z;
        f.y += f.vy * dt * f.z;
        if (f.x < -20) f.x = env.W + 20;
        if (f.x > env.W + 20) f.x = -20;
        if (f.y < -20) f.y = env.H + 20;
        if (f.y > env.H + 20) f.y = -20;
        // blink: a quick swell, a glow, a slower fade, then dark
        const u = ((t + f.ph * f.period) % f.period) / f.period;
        const b = u < 0.12 ? u / 0.12 : u < 0.3 ? 1 : u < 0.55 ? 1 - (u - 0.3) / 0.25 : 0;
        const level = 0.08 + 0.92 * b * b;
        const size = (22 + 34 * f.z) * (0.7 + 0.3 * level);
        ctx.globalAlpha = level * (env.dark ? 0.95 : 0.85) * env.lightK;
        ctx.drawImage(glow, f.x - size / 2, f.y - size / 2, size, size);
      }
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════
 * Falling blossoms
 * ════════════════════════════════════════════════════════════════════════ */

const BLOOM = 96;

function champaSprite(petal: Rgb, edge: Rgb, heart: Rgb) {
  return sprite(BLOOM, BLOOM, (c) => {
    c.translate(BLOOM / 2, BLOOM / 2);
    for (let i = 0; i < 5; i++) {
      c.save();
      c.rotate((i * Math.PI * 2) / 5);
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(10, -6, 26, -14, 34, -8);
      c.bezierCurveTo(42, -2, 36, 12, 22, 12);
      c.bezierCurveTo(12, 12, 4, 6, 0, 0);
      c.closePath();
      const g = c.createLinearGradient(0, 0, 36, 0);
      g.addColorStop(0, rgba(heart, 1));
      g.addColorStop(0.32, rgba(petal, 1));
      g.addColorStop(1, rgba(edge, 1));
      c.fillStyle = g;
      c.shadowColor = "rgba(80,50,30,0.25)";
      c.shadowBlur = 2;
      c.fill();
      c.shadowColor = "transparent";
      c.strokeStyle = "rgba(255,255,255,0.5)";
      c.lineWidth = 0.7;
      c.stroke();
      c.restore();
    }
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 8);
    g.addColorStop(0, rgba(heart, 1));
    g.addColorStop(1, rgba(heart, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, 8, 0, Math.PI * 2);
    c.fill();
  });
}

function jasmineSprite(petal: Rgb, heart: Rgb) {
  return sprite(BLOOM, BLOOM, (c) => {
    c.translate(BLOOM / 2, BLOOM / 2);
    for (let i = 0; i < 6; i++) {
      c.save();
      c.rotate((i * Math.PI * 2) / 6 + 0.2);
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(6, -5, 20, -7, 26, -2);
      c.bezierCurveTo(28, 2, 22, 6, 12, 5);
      c.closePath();
      const g = c.createLinearGradient(0, 0, 26, 0);
      g.addColorStop(0, rgba([240, 232, 210], 1));
      g.addColorStop(0.4, rgba(petal, 1));
      g.addColorStop(1, rgba([255, 255, 255], 1));
      c.fillStyle = g;
      c.shadowColor = "rgba(80,60,40,0.22)";
      c.shadowBlur = 2;
      c.fill();
      c.restore();
    }
    c.fillStyle = rgba(heart, 0.9);
    c.beginPath();
    c.arc(0, 0, 3, 0, Math.PI * 2);
    c.fill();
  });
}

function bloomShadow() {
  return shadowOf(BLOOM, BLOOM, (c) => {
    c.beginPath();
    c.arc(BLOOM / 2, BLOOM / 2, 26, 0, Math.PI * 2);
  }, 10);
}

type Fall = {
  x: number; y: number; z: number; theta: number; spin: number; phi: number; flip: number;
  sway: number; swayF: number; ph: number; fall: number; kind: number;
};

function newFall(env: Env, top: boolean, kinds: number, speed = 1): Fall {
  const { r } = env;
  const z = 0.45 + r() * 0.6;
  return {
    x: r() * env.W, y: top ? -40 - r() * env.H * 0.3 : r() * env.H, z,
    theta: r() * Math.PI * 2, spin: (r() - 0.5) * 1.6, phi: r() * Math.PI * 2, flip: (0.5 + r()) * (r() < 0.5 ? -1 : 1),
    sway: 16 + r() * 30, swayF: 0.25 + r() * 0.3, ph: r() * Math.PI * 2, fall: (22 + z * 22 + r() * 10) * speed,
    kind: Math.floor(r() * kinds),
  };
}

export function blossomLayer(env: Env): Layer {
  const n = Math.max(3, Math.round(8 * env.k));
  const sprites = [
    champaSprite([255, 250, 240], [255, 255, 252], [246, 196, 70]),
    champaSprite([252, 222, 226], [255, 244, 246], [244, 186, 80]),
    jasmineSprite([255, 252, 246], [232, 200, 120]),
  ];
  const shadow = bloomShadow();
  const items: Fall[] = [];
  return {
    counts: { blossoms: n },
    seed() {
      for (let i = 0; i < n; i++) items.push(newFall(env, false, sprites.length));
    },
    frame(ctx, dt, t) {
      ctx.globalCompositeOperation = "source-over";
      for (const p of items) {
        const edge = Math.abs(Math.cos(p.phi));
        p.y += p.fall * (1.2 - 0.35 * edge) * dt;
        p.x += (Math.cos(t * p.swayF + p.ph) * p.sway * p.swayF + Math.sin(t * 0.13 + p.ph) * 5) * dt;
        p.theta += p.spin * dt;
        p.phi += p.flip * dt * 0.8;
        if (p.y > env.H + 60) Object.assign(p, newFall(env, true, sprites.length));
        const s = 0.42 * p.z;
        const sx = Math.max(0.12, Math.abs(Math.cos(p.phi)));
        const off = 6 + 10 * p.z;
        ctx.save();
        ctx.translate(p.x + off * 0.7, p.y + off);
        ctx.rotate(p.theta);
        ctx.scale(sx * s, s);
        ctx.globalAlpha = (env.dark ? 0.3 : 0.15) * (0.5 + 0.5 * sx);
        ctx.drawImage(shadow, -BLOOM / 2, -BLOOM / 2);
        ctx.restore();
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.theta);
        ctx.transform(1, 0, Math.sin(p.phi) * 0.15, 1, 0, 0);
        ctx.scale(sx * s, s);
        ctx.globalAlpha = 0.8 + 0.2 * sx;
        ctx.drawImage(sprites[p.kind], -BLOOM / 2, -BLOOM / 2);
        ctx.restore();
      }
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════
 * Gold leaf
 * ════════════════════════════════════════════════════════════════════════ */

function leafFlakeSprite(seed: number, gold: Rgb, light: Rgb) {
  let s = seed;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  return sprite(64, 64, (c) => {
    c.translate(32, 32);
    // a torn, crinkled flake
    c.beginPath();
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rad = 16 + r() * 12;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad * (0.6 + r() * 0.4);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
    const g = c.createLinearGradient(-26, -20, 26, 20);
    g.addColorStop(0, rgba([Math.round(gold[0] * 0.7), Math.round(gold[1] * 0.7), Math.round(gold[2] * 0.6)], 1));
    g.addColorStop(0.35, rgba(gold, 1));
    g.addColorStop(0.5, rgba(light, 1));
    g.addColorStop(0.65, rgba(gold, 1));
    g.addColorStop(1, rgba([Math.round(gold[0] * 0.75), Math.round(gold[1] * 0.72), Math.round(gold[2] * 0.6)], 1));
    c.fillStyle = g;
    c.fill();
    c.save();
    c.clip();
    // creases
    c.strokeStyle = "rgba(255,250,230,0.5)";
    c.lineWidth = 0.6;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo((r() - 0.5) * 40, (r() - 0.5) * 40);
      c.lineTo((r() - 0.5) * 40, (r() - 0.5) * 40);
      c.stroke();
    }
    c.strokeStyle = "rgba(90,60,20,0.35)";
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo((r() - 0.5) * 40, (r() - 0.5) * 40);
      c.lineTo((r() - 0.5) * 40, (r() - 0.5) * 40);
      c.stroke();
    }
    c.restore();
  });
}

export function goldLeafLayer(env: Env): Layer {
  const n = Math.max(4, Math.round(14 * env.k));
  const sprites = [0, 1, 2, 3].map((i) => leafFlakeSprite(77 + i * 31, env.gold, env.goldLight));
  const flash = sprite(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,250,1)");
    g.addColorStop(0.3, rgba(env.goldLight, 0.6));
    g.addColorStop(1, rgba(env.goldLight, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
  const items: Fall[] = [];
  return {
    counts: { goldleaf: n },
    seed() {
      for (let i = 0; i < n; i++) items.push(newFall(env, false, sprites.length, 0.7));
    },
    frame(ctx, dt, t) {
      for (const p of items) {
        p.y += p.fall * dt;
        p.x += (Math.cos(t * p.swayF + p.ph) * p.sway * p.swayF) * dt;
        p.theta += p.spin * dt;
        p.phi += p.flip * dt * 1.6;
        if (p.y > env.H + 40) Object.assign(p, newFall(env, true, sprites.length, 0.7));
        const s = (0.22 + 0.38 * p.z);
        const sx = Math.max(0.1, Math.abs(Math.cos(p.phi)));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.theta);
        ctx.scale(sx * s, s);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.85;
        ctx.drawImage(sprites[p.kind], -32, -32);
        // a facet meeting the light
        const spec = Math.pow(Math.max(0, Math.cos(p.phi * 2 - 0.6)), 14);
        if (spec > 0.03) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = spec * 0.9;
          ctx.drawImage(flash, -32, -32);
        }
        ctx.restore();
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════
 * Starlight
 * ════════════════════════════════════════════════════════════════════════ */

type Star = { x: number; y: number; z: number; ph: number; f: number };
type Meteor = { x: number; y: number; vx: number; vy: number; t: number; dur: number };

export function starLayer(env: Env, glint: HTMLCanvasElement): Layer {
  const n = Math.round(60 * env.k);
  const tone: Rgb = env.dark ? [255, 250, 236] : env.gold;
  const dot = sprite(32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, rgba([255, 255, 255], 1));
    g.addColorStop(0.18, rgba(tone, 0.9));
    g.addColorStop(0.5, rgba(tone, 0.18));
    g.addColorStop(1, rgba(tone, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  });
  const stars: Star[] = [];
  const meteors: Meteor[] = [];
  let next = 3;
  const { r } = env;
  return {
    counts: { stars: n },
    seed() {
      for (let i = 0; i < n; i++) stars.push({ x: r() * env.W, y: r() * env.H, z: Math.pow(r(), 2), ph: r() * 100, f: 0.6 + r() * 2 });
    },
    frame(ctx, dt, t) {
      ctx.globalCompositeOperation = env.dark ? "lighter" : "source-over";
      for (const s of stars) {
        // slow breathing, and the quick scintillation of real starlight
        const tw = 0.55 + 0.3 * Math.sin(t * s.f + s.ph) + 0.15 * Math.sin(t * 9 * s.f + s.ph * 3);
        const size = env.dark ? 3 + s.z * 9 : 5 + s.z * 13;
        ctx.globalAlpha = Math.max(0, tw) * (0.35 + 0.65 * s.z);
        ctx.drawImage(dot, s.x - size / 2, s.y - size / 2, size, size);
        if (s.z > 0.75) {
          const g = size * 3.2 * (0.6 + 0.4 * tw);
          ctx.globalAlpha = Math.max(0, tw) * 0.6;
          ctx.drawImage(glint, s.x - g / 2, s.y - g / 2, g, g);
        }
      }
      next -= dt;
      if (next <= 0) {
        next = 5 + r() * 7;
        const fromLeft = r() < 0.5;
        meteors.push({
          x: env.W * (fromLeft ? 0.05 + r() * 0.4 : 0.55 + r() * 0.4), y: env.H * (0.05 + r() * 0.3),
          vx: (fromLeft ? 1 : -1) * (env.W * 0.9), vy: env.H * 0.35, t: 0, dur: 0.9 + r() * 0.4,
        });
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.t += dt;
        const u = m.t / m.dur;
        if (u >= 1) {
          meteors.splice(i, 1);
          continue;
        }
        const x = m.x + m.vx * m.t * 0.6;
        const y = m.y + m.vy * m.t * 0.6;
        const tail = 0.16;
        const g = ctx.createLinearGradient(x, y, x - m.vx * tail, y - m.vy * tail);
        const a = Math.sin(Math.PI * u) * env.lightK;
        g.addColorStop(0, rgba([255, 255, 255], a));
        g.addColorStop(0.15, rgba(tone, a * 0.7));
        g.addColorStop(1, rgba(tone, 0));
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - m.vx * tail, y - m.vy * tail);
        ctx.stroke();
        ctx.globalAlpha = a;
        ctx.drawImage(dot, x - 6, y - 6, 12, 12);
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════
 * Sunbeams
 * ════════════════════════════════════════════════════════════════════════ */

type Mote = { x: number; y: number; z: number; ph: number };

export function sunbeamLayer(env: Env, speck: HTMLCanvasElement): Layer {
  const beamCv = document.createElement("canvas");
  const bctx = beamCv.getContext("2d")!;
  const light: Rgb = env.dark ? [255, 222, 180] : [255, 230, 170];
  const beams = [
    { at: 0.12, w: 0.1, a: 0.9, ph: 0.3 },
    { at: 0.3, w: 0.16, a: 0.7, ph: 1.7 },
    { at: 0.52, w: 0.08, a: 0.85, ph: 2.9 },
    { at: 0.7, w: 0.13, a: 0.6, ph: 4.1 },
  ];
  const motes: Mote[] = [];
  const nMotes = Math.round(40 * env.k);
  const { r } = env;
  const slope = 0.62; // the beams fall from the upper left at this run per rise
  return {
    counts: { beams: beams.length, motes: nMotes },
    seed() {
      for (let i = 0; i < nMotes; i++) motes.push({ x: r() * env.W, y: r() * env.H, z: r(), ph: r() * 100 });
    },
    frame(ctx, dt, t) {
      const lw = Math.max(8, Math.ceil(env.W / 6));
      const lh = Math.max(8, Math.ceil(env.H / 6));
      if (beamCv.width !== lw || beamCv.height !== lh) {
        beamCv.width = lw;
        beamCv.height = lh;
      }
      bctx.clearRect(0, 0, lw, lh);
      bctx.save();
      // shear so vertical bands become diagonal shafts
      bctx.setTransform(1, 0, -slope, 1, lh * slope * 0.2, 0);
      for (const b of beams) {
        const breathe = 0.6 + 0.4 * Math.sin(t * 0.25 + b.ph);
        const x = (b.at + 0.03 * Math.sin(t * 0.07 + b.ph)) * lw * 1.6;
        const w = b.w * lw;
        const g = bctx.createLinearGradient(x - w, 0, x + w, 0);
        const a = b.a * breathe * (env.dark ? 0.16 : 0.5) * env.lightK;
        g.addColorStop(0, rgba(light, 0));
        g.addColorStop(0.5, rgba(light, a));
        g.addColorStop(1, rgba(light, 0));
        bctx.fillStyle = g;
        bctx.fillRect(x - w, 0, w * 2, lh);
      }
      bctx.restore();
      // the beams fade as they fall, as light does in a room
      bctx.globalCompositeOperation = "destination-in";
      const fade = bctx.createLinearGradient(0, 0, 0, lh);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(1, "rgba(0,0,0,0.15)");
      bctx.fillStyle = fade;
      bctx.fillRect(0, 0, lw, lh);
      bctx.globalCompositeOperation = "source-over";
      ctx.globalCompositeOperation = env.dark ? "lighter" : "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(beamCv, 0, 0, env.W, env.H);

      // motes: brightest where they cross a shaft
      ctx.globalCompositeOperation = env.dark ? "lighter" : "source-over";
      for (const m of motes) {
        m.y -= (3 + m.z * 6) * dt;
        m.x += Math.sin(t * 0.3 + m.ph) * 4 * dt;
        if (m.y < -6) {
          m.y = env.H + 6;
          m.x = r() * env.W;
        }
        const u = (m.x + m.y * slope) / (env.W * 1.6);
        let lit = 0.1;
        for (const b of beams) lit = Math.max(lit, Math.exp(-(((u - b.at) / (b.w * 0.6)) ** 2)));
        const size = (2 + m.z * 4) * 2.2;
        ctx.globalAlpha = lit * (0.4 + 0.6 * m.z) * (1 - m.y / env.H / 1.6);
        ctx.drawImage(speck, m.x - size / 2, m.y - size / 2, size, size);
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
}

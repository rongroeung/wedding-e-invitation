"""
Curtain fabric, rendered offline.

A heightfield of one hanging panel (irregular gravity folds, pinched at the
heading, flaring toward the hem, with a few folds that split on the way down),
lit by one soft key light from above and in front, with wrap diffuse, cavity
occlusion and a restrained satin sheen on the raised folds. Written out as a
*luminance* map: the page tints it with the theme's own cloth colour
(`background-blend-mode: luminosity`), so the shading is photographic and the
colour stays the couple's.

Also writes the valley lines of every map as a TypeScript module, so the
component can cut each fold out along its real valley and gather it on its own.

usage: fabric.py <outdir> <ts-module-path> [--preview <png>]
"""
import json, sys
import numpy as np
from PIL import Image

OUT, TS = sys.argv[1], sys.argv[2]
PREVIEW = sys.argv[sys.argv.index("--preview") + 1] if "--preview" in sys.argv else None


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def blur(img, r):
    """Separable box blur x3 (≈ Gaussian), edge-clamped."""
    out = img
    for _ in range(3):
        for axis in (0, 1):
            pad = [(0, 0), (0, 0)]; pad[axis] = (r, r)
            p = np.pad(out, pad, mode="edge")
            c = np.cumsum(p, axis=axis, dtype=np.float64)
            c = np.insert(c, 0, 0, axis=axis)
            n = out.shape[axis]
            sl_hi = [slice(None)] * 2; sl_lo = [slice(None)] * 2
            sl_hi[axis] = slice(2 * r + 1, 2 * r + 1 + n); sl_lo[axis] = slice(0, n)
            out = (c[tuple(sl_hi)] - c[tuple(sl_lo)]) / (2 * r + 1)
    return out


def panel(W, H, folds, seed):
    """One panel, leading edge at the right (x = W). Returns luminance 0..1, valleys."""
    rng = np.random.default_rng(seed)
    n = folds
    y = np.linspace(0, 1, H)[:, None]
    x = np.arange(W)[None, :] / (W - 1)

    # ── where the valleys run ──────────────────────────────────────────────
    # Uneven spacing, widening toward the leading edge (the free-hanging part).
    w = rng.uniform(0.6, 1.45, n) * np.linspace(0.86, 1.18, n)
    base = np.concatenate([[0], np.cumsum(w) / w.sum()])
    flare = np.zeros(n + 1); flare[1:-1] = rng.uniform(0.012, 0.03, n - 1)
    sway_a = np.zeros(n + 1); sway_a[1:-1] = rng.uniform(0.006, 0.016, n - 1) * rng.choice([-1, 1], n - 1)
    sway_f = rng.uniform(0.7, 1.4, n + 1)
    sway_p = rng.uniform(0, 2 * np.pi, n + 1)
    wob_a = np.zeros(n + 1); wob_a[1:-1] = rng.uniform(0.0008, 0.002, n - 1)

    def valley(k, v):
        return (base[k] + flare[k] * (v ** 1.4)
                + sway_a[k] * np.sin(np.pi * sway_f[k] * v + sway_p[k]) * smooth(0, 0.3, v)
                + wob_a[k] * np.sin(2 * np.pi * 2.6 * v + 1.7 * k))

    V = np.stack([valley(k, y[:, 0]) for k in range(n + 1)], axis=1)  # H × (n+1)
    V[:, 0] = 0; V[:, -1] = 1

    # ── the cross-section of every fold ────────────────────────────────────
    Hf = np.zeros((H, W))
    Wpx = W
    depth = rng.uniform(0.5, 0.85, n)
    crest = rng.uniform(0.38, 0.6, n)
    crest_drift = rng.uniform(-0.08, 0.08, n)
    for k in range(n):
        L = V[:, k][:, None]; R = V[:, k + 1][:, None]
        width = (R - L)
        t = (x - L) / width
        inside = (t >= 0) & (t <= 1)
        c = np.clip(crest[k] + crest_drift[k] * (y - 0.5), 0.25, 0.75)
        g = np.log(0.5) / np.log(c)
        tt = np.clip(t, 0, 1) ** g
        # broad rounded crest, the valley pinched where the two faces meet
        prof = np.sin(np.pi * tt) ** 0.85
        # fuller lower down, pinched under the heading
        # each fold deepens and relaxes along its drop, at its own rhythm
        breathe = 1 + 0.22 * np.sin(2 * np.pi * (rng.uniform(0.5, 1.1) * y) + rng.uniform(0, 6.3))
        amp = depth[k] * width * Wpx * (0.62 + 0.38 * smooth(0.02, 0.55, y)) * breathe
        Hf += np.where(inside, amp * prof, 0)

    # pinch pleats at the heading: each fold gathered into three small pleats
    # that merge into it within the first tenth of the drop
    for k in range(n):
        L = V[:, k][:, None]; R = V[:, k + 1][:, None]
        t = (x - L) / (R - L)
        inside = (t >= 0) & (t <= 1)
        pin = (1 - np.cos(2 * np.pi * 3 * np.clip(t, 0, 1))) / 2
        Hf += np.where(inside, pin * (R - L) * Wpx * 0.09 * (1 - smooth(0.0, 0.11, y)), 0)

    # folds that split on the way down: a secondary ridge growing out of a face
    for _ in range(max(1, n // 2)):
        k = rng.integers(0, n)
        L = V[:, k][:, None]; R = V[:, k + 1][:, None]
        t = (x - L) / (R - L)
        at = rng.uniform(0.22, 0.4) if rng.random() < 0.5 else rng.uniform(0.6, 0.78)
        v0 = rng.uniform(0.18, 0.5)
        bump = np.exp(-((t - at) / 0.14) ** 2) * (R - L) * Wpx * 0.07
        Hf += np.where((t > 0) & (t < 1), bump * smooth(v0, v0 + 0.3, y), 0)

    # the panel itself bellies gently, so the light changes across it as a whole
    Hf += Wpx * 0.05 * np.sin(np.pi * x) * (0.6 + 0.4 * y)

    # the leading edge: a hem rolled back on itself, so it turns into the light
    edge = smooth(0.975, 1.0, x)
    Hf -= edge ** 2 * Wpx * 0.02

    # tiny irregularities of real cloth: low-frequency, not noise
    lo = rng.normal(size=(4, W // 30 + 2))
    lo = np.array(Image.fromarray(lo.astype(np.float32)).resize((W, H), Image.BICUBIC))
    Hf += blur(lo, 6) * Wpx * 0.003

    # ── light ──────────────────────────────────────────────────────────────
    gy, gx = np.gradient(Hf)
    N = np.stack([-gx, gy, np.ones_like(Hf)], -1)  # y up = −image y
    N /= np.linalg.norm(N, axis=-1, keepdims=True)
    Lk = np.array([0.3, 0.5, 0.78]); Lk /= np.linalg.norm(Lk)  # above, in front, toward the stage centre
    ndl = (N * Lk).sum(-1)
    wrap = 0.18
    diff = np.clip((ndl + wrap) / (1 + wrap), 0, 1)

    # cavity: the faces of a valley shade each other
    cav = blur(Hf, max(6, W // 36)) - Hf
    ao = np.exp(-np.clip(cav, 0, None) / (Wpx * 0.016))

    # satin, restrained: a broad sheen only where the cloth rises toward the light
    Hv = Lk + np.array([0, 0, 1.0]); Hv /= np.linalg.norm(Hv)
    ndh = np.clip((N * Hv).sum(-1), 0, 1)
    raised = smooth(0.2, 0.8, (Hf - Hf.min()) / (np.ptp(Hf) + 1e-6))
    sheen = 0.05 * ndh ** 10 * raised

    # where the lamp lands: a pool high on the cloth, falling off to the wings
    # and toward the floor; a soft shade under the heading
    pool = (0.86 + 0.14 * np.exp(-((y - 0.34) / 0.42) ** 2)) * (0.8 + 0.2 * x ** 0.7)
    pool *= 1 - 0.22 * smooth(0.6, 1.0, y)
    pool *= 1 - 0.28 * (1 - smooth(0.0, 0.07, y))

    lum = (0.12 + 0.88 * diff * ao) * pool + sheen

    valleys = [[round(float(V[int(i), k]), 4) for i in np.linspace(0, H - 1, 17)] for k in range(n + 1)]
    return lum, valleys


def to_grey(lum, lo=0.1, hi=0.86):
    """Map rendered light to the luminance the page will show, gently filmic."""
    l = np.clip(lum / np.percentile(lum, 99.5), 0, 1) ** 0.95
    g = lo + (hi - lo) * l
    g += np.random.default_rng(1).uniform(-0.5, 0.5, g.shape) / 255  # dither: no banding
    return np.clip(g * 255 + 0.5, 0, 255).astype(np.uint8)


SETS = {"narrow": (4, 512, 1600), "wide": (6, 900, 1500)}
SEEDS = {("narrow", "left"): 11, ("narrow", "right"): 23, ("wide", "left"): 7, ("wide", "right"): 41}
meta = {}
previews = []
for name, (n, W, H) in SETS.items():
    meta[name] = {}
    for side in ("left", "right"):
        lum, valleys = panel(W, H, n, SEEDS[(name, side)])
        g = to_grey(lum)
        # Both panels are rendered with the leading edge on the right and the
        # light coming from that side; the page hangs the right-hand one
        # mirrored, so its light also comes from the middle of the stage.
        Image.fromarray(g, "L").convert("RGB").save(f"{OUT}/curtain-{name}-{side}.webp", quality=84, method=6)
        meta[name][side] = valleys
        previews.append((name, side, g if side == "left" else g[:, ::-1]))

with open(TS, "w") as f:
    f.write("/*\n * Generated by the curtain fabric renderer — do not edit by hand.\n *\n"
            " * The valley lines of each pre-rendered panel in `/public/kit/curtain-*.webp`,\n"
            " * as fractions of the panel's width, sampled at 17 evenly spaced heights from\n"
            " * the heading (first) to the hem (last). Ordered from the outer edge (the\n"
            " * wall) to the leading edge (the middle of the stage), so the first and last\n"
            " * lines are the panel's own edges. Every panel is drawn as a left-hand one;\n"
            " * the right-hand panel is the same construction hung mirrored.\n */\n")
    f.write("export const CURTAIN_VALLEYS = " + json.dumps(meta) + " as const;\n")

if PREVIEW:
    # the two panels of each set side by side, tinted roughly like the page will
    tint = np.array([0xa3, 0x91, 0x7b]) / 255
    rows = []
    for name in SETS:
        L = [g for (nm, s, g) in previews if nm == name]
        h = 900
        parts = [np.array(Image.fromarray(g).resize((int(g.shape[1] * h / g.shape[0] * (1.0 if name == "wide" else 1.4)), h))) for g in L]
        rows.append(np.concatenate(parts, 1))
    w = max(r.shape[1] for r in rows)
    canvas = np.full((900, sum(r.shape[1] for r in rows) + 20), 255, np.uint8)
    x0 = 0
    for r in rows:
        canvas[:, x0:x0 + r.shape[1]] = r; x0 += r.shape[1] + 20
    g = canvas.astype(float) / 255
    # luminosity blend (W3C SetLum) of the tint at this grey
    lt = 0.3 * tint[0] + 0.59 * tint[1] + 0.11 * tint[2]
    c = tint[None, None, :] + (g - lt)[..., None]
    l = g[..., None]
    mn = c.min(-1, keepdims=True); mx = c.max(-1, keepdims=True)
    c = np.where(mn < 0, l + (c - l) * l / (l - mn + 1e-6), c)
    c = np.where(mx > 1, l + (c - l) * (1 - l) / (mx - l + 1e-6), c)
    Image.fromarray((np.clip(c, 0, 1) * 255).astype(np.uint8)).save(PREVIEW)
print("ok")

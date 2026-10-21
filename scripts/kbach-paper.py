"""
The invitation papers: Khmer kbach ornament and flowers, pressed and printed
into a cotton sheet.

For every pattern this writes five seamless tiles into the output folder, all
neutral, so the paper theme supplies every colour in CSS:

  <name>-relief.webp   the emboss of everything on the sheet, as light and
                       shade around mid grey (blended with `overlay`), so it
                       presses into any paper colour and shades foil and
                       flowers as the light falls on them
  <name>-foil.webp     where the kbach is struck in metal foil (alpha mask)
  <name>-petal.webp    the flowers' petals, printed in colour (alpha mask, with
  <name>-heart.webp    each flower's heart, a second colour     a watercolour
  <name>-leaf.webp     leaves and stems, a third colour         density)

and one shared texture, paper-cotton-fine.webp (mottle, fibre and grain).

Patterns (thirty, one per paper; see src/lib/paper-themes.json):

  Khmer artwork   kbach-damask, kbach-medallion, phka-chan, phni-waves, kanok,
                  lintel, star-net, ogee-kbach, hol-ikat, kbach-silk
  flowers         rose-bouquet, daisy-meadow, rumduol-branch, frangipani,
                  jasmine-sprig, cherry-blossom, orchid, peony, camellia,
                  wildflowers
  kbach + flowers damask, silk, rumduol, champa, rose, jasmine, daisy-kbach,
                  sakura-kbach, orchid-kbach, peony-kbach

All of it is drawn from geometry here, not traced from anyone's artwork.

How it is drawn: a painter's algorithm at 3× supersampling. Every shape
belongs to one layer (foil, blind emboss, petal, heart or leaf) and covers
whatever was drawn before it, in colour and in height, so overlapping petals
show their edges in the relief the way stacked petals do. Petals carry a
shading profile from base to tip, and a dome, so each one is cupped rather
than stamped flat. The colour layers are given a watercolour density: fuller
where the pigment pools at the edges, uneven across the sheet.

Every shape is drawn wherever the repeat would show it and every filter
wraps, so the tiles have no seam.

Conventions: screen coordinates (y down); an angle is a screen heading,
atan2(dy, dx), so -pi/2 points up. Shapes are built in their own frame
heading +x, and curl toward local -y unless flipped.

usage: python3 scripts/kbach-paper.py public/paper [pattern ...]
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

OUT = sys.argv[1] if len(sys.argv) > 1 else "public/paper"
ONLY = set(sys.argv[2:])
SS = 3
UP = -np.pi / 2
LAYERS = ("foil", "blind", "petal", "heart", "leaf")


# ── geometry ────────────────────────────────────────────────────────────────

def xf(pts, x, y, ang=0.0, k=1.0, flip=False):
    p = np.asarray(pts, float)
    lx, ly = p[..., 0] * k, p[..., 1] * k * (-1 if flip else 1)
    c, s = math.cos(ang), math.sin(ang)
    return np.stack([x + lx * c - ly * s, y + lx * s + ly * c], -1)


class Shape:
    """Filled polygons and carved lines, in one local frame."""

    def __init__(self):
        self.polys, self.cuts = [], []

    def add(self, other, x=0.0, y=0.0, ang=0.0, k=1.0, flip=False):
        for p in other.polys:
            self.polys.append(xf(p, x, y, ang, k, flip))
        for c, w in other.cuts:
            self.cuts.append((xf(c, x, y, ang, k, flip), w * k))
        return self


def spine(L, bend, curl, start=0.55, n=240, sway=0.0):
    ds = L / n
    u = np.arange(n + 1) / n
    tail = np.clip((u - start) / (1 - start), 0, 1)
    kappa = (bend + sway * (2 * u - 0.7) + tail ** 2 * curl * 3 / (1 - start)) / L
    heading = np.concatenate([[0.0], np.cumsum(kappa[:-1] * ds)])
    x = np.concatenate([[0.0], np.cumsum(np.cos(heading[:-1]) * ds)])
    y = np.concatenate([[0.0], np.cumsum(-np.sin(heading[:-1]) * ds)])
    return np.stack([x, y], 1), heading, u


def hook(L, W, curl=2.4, bend=0.4):
    p, h, u = spine(L, bend, curl, start=0.45, n=90)
    nl = np.stack([-np.sin(h), -np.cos(h)], 1)
    w = W * (1 - u) ** 1.3 + 0.02 * W
    s = Shape()
    s.polys.append(np.concatenate([p - nl * (w * 0.45)[:, None], (p + nl * (w * 0.55)[:, None])[::-1]]))
    return s


def scroll_leaf(L, W, bend=0.5, curl=4.6, hooks=4, hook_size=0.55, carve=True, sway=1.4):
    """A kbach scroll leaf: an S-curved blade rolling into a spiral, flame
    hooks along its outer edge flicking toward the tip."""
    p, h, u = spine(L, bend, curl, start=0.42, sway=sway)
    nl = np.stack([-np.sin(h), -np.cos(h)], 1)
    w = W * (0.42 + 0.58 * np.sin(np.pi / 2 * np.clip(u / 0.25, 0, 1))) * (1 - u) ** 0.62 + W * 0.06
    outer = p - nl * (w * 0.55)[:, None]
    inner = p + nl * (w * 0.45)[:, None]
    s = Shape()
    s.polys.append(np.concatenate([outer, inner[::-1]]))
    for i in range(hooks):
        ui = 0.12 + 0.5 * i / max(1, hooks - 1)
        j = int(ui * (len(p) - 1))
        size = hook_size * (1 - 0.55 * i / max(1, hooks)) * W
        base = outer[j] + (p[j] - outer[j]) * 0.25
        s.add(hook(size * 2.8, size * 1.0, curl=3.0), *base, ang=-h[j] + 0.55, flip=True)
    if carve:
        lo, hi = int(0.06 * len(p)), int(0.72 * len(p))
        s.cuts.append((p[lo:hi] + nl[lo:hi] * (w[lo:hi] * 0.05)[:, None], float(np.mean(w[lo:hi]) * 0.16)))
    return s


def flame(H, W, lobes=2):
    """The pointed crown of a spray, from its base (origin) along local -x."""
    u = np.linspace(0, 1, 160)
    belly = np.where(u < 0.32, np.sin(np.pi / 2 * np.clip(u / 0.32, 0, 1)) ** 0.7, ((1 - u) / 0.68) ** 1.6)
    x = W * belly
    lean = 0.08 * W * np.sin(np.pi * u) * u
    s = Shape()
    s.polys.append(np.concatenate([np.stack([-H * u, x + lean], 1), np.stack([-H * u, -x + lean], 1)[::-1]]))
    for i in range(lobes):
        ui = 0.22 + 0.24 * i
        j = int(ui * 159)
        size = W * (0.7 - 0.2 * i)
        for side in (1, -1):
            s.add(hook(size * 2.2, size * 0.75, curl=2.4), -H * ui, side * x[j] * 0.7, ang=math.pi - side * 0.55, flip=side < 0)
    s.cuts.append((np.stack([-H * u[12:110], lean[12:110]], 1), W * 0.14))
    return s


def petal(h, w, sharp=1.0):
    """A pointed petal from its base (origin) along +x to (h, 0)."""
    t = np.linspace(0, 1, 90)
    half = (w / 2) * np.sin(np.pi * t) ** 0.85 * (1 - 0.25 * t) * (1 - t ** (6 / sharp))
    return np.concatenate([np.stack([h * t, half], 1), np.stack([h * t, -half], 1)[::-1]])


def bud_petal(h, w):
    t = np.linspace(0, 1, 90)
    half = (w / 2) * np.sin(np.pi * t ** 0.72) ** 0.9
    return np.concatenate([np.stack([h * t, half], 1), np.stack([h * t, -half], 1)[::-1]])


def round_petal(h, w, notch=0.0, skew=0.0):
    """An obovate petal: narrow at the base, broad and rounded at the tip,
    optionally notched (a rose) or swept to one side (a frangipani)."""
    t = np.linspace(0, 1, 120)
    half = (w / 2) * np.sin(np.pi / 2 * np.clip(t / 0.62, 0, 1)) ** 0.8
    cap = t > 0.62
    q = (t[cap] - 0.62) / 0.38
    half[cap] = (w / 2) * np.sqrt(np.clip(1 - q ** 2, 0, 1))
    x = h * t
    sweep = skew * h * t ** 2
    right = np.stack([x, half + sweep], 1)
    left = np.stack([x, -half + sweep], 1)
    if notch:
        tip = np.array([[h * (1 - notch), sweep[-1]]])
        return np.concatenate([right, tip, left[::-1]])
    return np.concatenate([right, left[::-1]])


def leaf_shape(L, W, bend=0.25):
    """A pointed leaf along +x, slightly bent."""
    t = np.linspace(0, 1, 100)
    half = (W / 2) * np.sin(np.pi * t ** 0.85) ** 0.9
    mid = bend * L * 0.3 * np.sin(np.pi * t)
    return np.concatenate([np.stack([L * t, mid + half], 1), np.stack([L * t, mid - half], 1)[::-1]]), np.stack([L * t, mid], 1)


def circle(r, n=56):
    a = np.linspace(0, 2 * np.pi, n, endpoint=False)
    return np.stack([np.cos(a) * r, np.sin(a) * r], 1)


# ── the canvas: a painter's algorithm that wraps ───────────────────────────

class Tile:
    def __init__(self, T):
        self.T = T
        self.n = T * SS
        self.L = {k: np.zeros((self.n, self.n), np.float32) for k in LAYERS}
        self.H = np.zeros((self.n, self.n), np.float32)
        # for the engraving: which shape is on top at each pixel, what kind
        # it is (1 kbach in foil, 2 flower or leaf, 3 blind kbach), the
        # direction of its hatching, and how dark its shading is there
        self.ID = np.zeros((self.n, self.n), np.int32)
        self.KIND = np.zeros((self.n, self.n), np.int8)
        self.ANG = np.zeros((self.n, self.n), np.float32)
        self.SH = np.zeros((self.n, self.n), np.float32)
        self.VEIN = np.zeros((self.n, self.n), np.float32)
        self.nid = 0

    def _offsets(self, pts):
        T = self.T
        lo, hi = pts.min(0), pts.max(0)
        for dx in (-T, 0, T):
            for dy in (-T, 0, T):
                if hi[0] + dx < -2 or lo[0] + dx > T + 2 or hi[1] + dy < -2 or lo[1] + dy > T + 2:
                    continue
                yield dx, dy

    def _stamp(self, q, draw_fn):
        """Rasterise into a small box around q (SS px); returns (box, cov)."""
        x0, y0 = np.floor(q.min(0)).astype(int) - 3
        x1, y1 = np.ceil(q.max(0)).astype(int) + 3
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(self.n, x1), min(self.n, y1)
        if X1 <= X0 or Y1 <= Y0:
            return None
        im = Image.new("L", (x1 - x0, y1 - y0), 0)
        draw_fn(ImageDraw.Draw(im), q - [x0, y0])
        cov = np.asarray(im, np.float32)[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0] / 255
        return (slice(Y0, Y1), slice(X0, X1)), cov, (x0, y0)

    def _apply(self, box, cov, layer, erase, value, height, ang=0.0, shade=0.0):
        m = cov > 0.5
        if erase:
            self.L[layer][box] *= 1 - cov
            self.H[box] = np.maximum(0, self.H[box] - 0.32 * cov)
            self.ID[box][m] = 0
            self.KIND[box][m] = 0
            return
        for k in LAYERS:
            if k != layer:
                self.L[k][box] *= 1 - cov
        self.L[layer][box] = self.L[layer][box] * (1 - cov) + cov * value
        self.H[box] = self.H[box] * (1 - cov) + cov * height
        self.nid += 1
        self.ID[box][m] = self.nid
        self.KIND[box][m] = 1 if layer == "foil" else 3 if layer == "blind" else 2
        self.ANG[box][m] = ang
        sh = shade if np.isscalar(shade) else shade[m]
        self.SH[box][m] = sh

    def poly(self, pts, layer, erase=False, axis=None, alpha=(1.0, 1.0), dome=0.0, z=0.0, veins=0):
        """A filled polygon. With `axis` ((x0, y0), (x1, y1), base to tip),
        colour runs from alpha[0] at the base to alpha[1] at the tip (eased),
        the shape is domed along it, and `veins` fine grooves fan from the
        base toward the tip."""
        pts = np.asarray(pts, float)
        for dx, dy in self._offsets(pts):
            q = (pts + [dx, dy]) * SS
            r = self._stamp(q, lambda d, qq: d.polygon([tuple(v) for v in qq], fill=255))
            if r is None:
                continue
            box, cov, _ = r
            value, height = 1.0, 1.0 + z
            ang, shade = 0.0, 0.22
            if axis is not None:
                a0 = (np.asarray(axis[0], float) + [dx, dy]) * SS
                a1 = (np.asarray(axis[1], float) + [dx, dy]) * SS
                yy, xx = np.mgrid[box[0], box[1]].astype(np.float32)
                v = a1 - a0
                t = np.clip(((xx - a0[0]) * v[0] + (yy - a0[1]) * v[1]) / (v @ v + 1e-6), 0, 1)
                value = alpha[0] + (alpha[1] - alpha[0]) * t ** 1.4
                height = 1.0 + z + dome * np.sin(np.pi * np.clip(t * 0.9 + 0.05, 0, 1)) ** 0.7 - dome * 0.35 * (1 - t)
                ang = math.atan2(v[1], v[0])
                # an engraver shades the throat of a petal and leaves its
                # lip in light
                shade = 0.06 + 0.8 * (1 - t) ** 1.6
            self._apply(box, cov, layer, erase, value, height, ang, shade)
        if veins and axis is not None and not erase:
            a0, a1 = np.asarray(axis[0], float), np.asarray(axis[1], float)
            v = a1 - a0
            L = float(np.hypot(*v))
            n = np.array([-v[1], v[0]]) / (L + 1e-6)
            span = (pts - a0) @ n
            half = (span.max() - span.min()) / 2 * 0.62
            for i in range(veins):
                f = (i / max(1, veins - 1) - 0.5) * 2
                path = np.array([a0 + v * s + n * f * half * math.sin(math.pi * min(1, s * 1.1)) ** 0.8 for s in np.linspace(0.08, 0.86, 14)])
                self.groove(path, max(0.5, L * 0.012), 0.12)

    def groove(self, pts, width, depth):
        """A fine line pressed into the relief only (a vein), colour untouched."""
        pts = np.asarray(pts, float)
        wd = max(1, int(round(width * SS)))
        for dx, dy in self._offsets(pts):
            r = self._stamp((pts + [dx, dy]) * SS, lambda d, qq: d.line([tuple(v) for v in qq], fill=255, width=wd, joint="curve"))
            if r is None:
                continue
            box, cov, _ = r
            self.H[box] -= depth * cov
            self.VEIN[box] = np.maximum(self.VEIN[box], cov)
            for k in ("petal", "heart", "leaf"):
                self.L[k][box] *= 1 - 0.25 * cov

    def line(self, pts, width, layer, erase=False, z=0.0):
        pts = np.asarray(pts, float)
        wd = max(1, int(round(width * SS)))
        r_ = wd / 2

        def draw(d, qq):
            d.line([tuple(v) for v in qq], fill=255, width=wd, joint="curve")
            for v in (qq[0], qq[-1]):
                d.ellipse([v[0] - r_, v[1] - r_, v[0] + r_, v[1] + r_], fill=255)

        for dx, dy in self._offsets(pts):
            r = self._stamp((pts + [dx, dy]) * SS, draw)
            if r is None:
                continue
            box, cov, _ = r
            self._apply(box, cov, layer, erase, 1.0, 0.8 + z, 0.0, 0.0)

    def dot(self, x, y, r, layer, z=0.0):
        self.poly(circle(r) + [x, y], layer, axis=((x, y + r), (x, y - r)), dome=0.5, z=z)

    def shape(self, s, layer, x=0.0, y=0.0, ang=0.0, k=1.0, flip=False, z=0.0):
        world = Shape().add(s, x, y, ang, k, flip)
        for p in world.polys:
            self.poly(p, layer, z=z)
        for c, w in world.cuts:
            self.line(c, w, layer, erase=True)

    def result(self):
        T = self.T
        down = lambda a: a.reshape(T, SS, T, SS).mean((1, 3))
        return {k: down(v) for k, v in self.L.items()}, down(self.H)

    def engraving(self, seed=0):
        """The printed line work, from the shapes as drawn:

        kline  the outline of every kbach shape and its carved lines — the
               ornament as a Khmer draughtsman draws it, printed in gold;
        fline  each petal and leaf outlined, shaded with hatching that runs
               along its length and thickens toward its throat, and veined:
               a botanical engraving, printed in ink;
        bline  the blind ornament's outline, pressed into the paper only.

        Lines carry a little irregularity — a wander in the hatching, an
        uneven inking — so they read as cut by hand and printed, not drawn.
        """
        T, ID, K = self.T, self.ID, self.KIND
        rng = np.random.default_rng(seed)
        edge = np.zeros(ID.shape, bool)
        for ax in (0, 1):
            for sh in (1, -1):
                edge |= ID != np.roll(ID, sh, ax)
        edge = ndimage.binary_dilation(edge, iterations=1)
        near = lambda k: ndimage.maximum_filter((K == k).astype(np.uint8), size=5, mode="wrap") > 0
        kline = edge & near(1)
        bline = edge & near(3) & ~kline
        fline = edge & near(2) & ~kline
        # hatching inside flowers and leaves
        n = self.n
        wander = ndimage.gaussian_filter(rng.standard_normal((-(-n // 8), -(-n // 8))), 3, mode="wrap")
        wander = np.kron(wander / (wander.std() + 1e-6), np.ones((8, 8), np.float32))[:n, :n]
        yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
        A = self.ANG + np.pi / 2
        proj = xx * np.cos(A) + yy * np.sin(A)
        P = 4.2 * SS
        frac = np.mod(proj / P + wander * 0.18, 1.0)
        dist = np.abs(frac - 0.5) * 2
        hatch = (K == 2) & (self.SH > 0.1) & (dist < self.SH * 0.42)
        del yy, xx, proj, frac, dist
        f = np.maximum(fline.astype(np.float32), hatch.astype(np.float32) * 0.85)
        f = np.maximum(f, (self.VEIN > 0.4).astype(np.float32) * 0.9)
        ink = ndimage.gaussian_filter(rng.standard_normal((-(-n // 6), -(-n // 6))), 2, mode="wrap")
        ink = np.kron(ink / (ink.std() + 1e-6), np.ones((6, 6), np.float32))[:n, :n]
        f *= np.clip(0.86 + 0.12 * ink, 0.6, 1)
        down = lambda a: a.astype(np.float32).reshape(T, SS, T, SS).mean((1, 3))
        return down(kline), down(f), down(bline)


# ── kbach motifs ───────────────────────────────────────────────────────────

BIG = scroll_leaf(180, 40, bend=0.5, curl=5.2, hooks=4)
MID = scroll_leaf(126, 30, bend=0.4, curl=4.8, hooks=3)
SMALL = scroll_leaf(76, 19, bend=0.3, curl=4.4, hooks=2, hook_size=0.6)
CROWN = flame(130, 26, lobes=2)


def rosette(t, x, y, r, layer, n=8, rings=2, a0=0.0):
    for ring in range(rings):
        rr = r * (1 - 0.34 * ring)
        off = a0 + (np.pi / n) * ring
        for i in range(n):
            a = off + 2 * np.pi * i / n
            t.poly(xf(petal(rr, rr * (0.56 if ring == 0 else 0.5)), x, y, a), layer,
                   axis=((x, y), (x + math.cos(a) * rr, y + math.sin(a) * rr)), dome=0.5, z=0.1 * ring)
            t.line(xf(np.array([[rr * 0.3, 0], [rr * 0.78, 0]]), x, y, a), max(1.0, rr * 0.05), layer, erase=True)
        t.poly(circle(rr * 0.4) + [x, y], layer, erase=True)
        t.poly(circle(rr * 0.33) + [x, y], layer, z=0.3)
    t.poly(circle(r * 0.2) + [x, y], layer, erase=True)
    t.dot(x, y, r * 0.13, layer, z=0.4)
    for i in range(10):
        a = 2 * np.pi * i / 10
        t.dot(x + math.cos(a) * r * 0.26, y + math.sin(a) * r * 0.26, max(1.1, r * 0.03), layer, z=0.35)


def spray(t, x, y, ang, k, layer, crown=True):
    d = np.array([math.cos(ang), math.sin(ang)])
    side = np.array([-d[1], d[0]])
    at = lambda a, s=0.0: np.array([x, y]) + d * a * k + side * s * k
    t.line(np.array([at(10), at(150 if crown else 110)]), 8 * k, layer)
    t.line(np.array([at(18), at(142 if crown else 104)]), 2.6 * k, layer, erase=True)
    for sg in (1, -1):
        t.shape(BIG, layer, *at(30, sg * 4), ang=ang + sg * 1.05, k=k, flip=sg > 0)
        t.shape(MID, layer, *at(102, sg * 3), ang=ang + sg * 0.7, k=k, flip=sg > 0)
    if crown:
        t.shape(CROWN, layer, *at(146), ang=ang + math.pi, k=k)
        t.dot(*at(146), 7 * k, layer)


def vine_path(p0, p1, amp, n=200):
    p0, p1 = np.array(p0, float), np.array(p1, float)
    d = p1 - p0
    nrm = np.array([-d[1], d[0]]) / float(np.hypot(*d))
    s = np.linspace(0, 1, n)
    return p0 + np.outer(s, d) + np.outer(amp * np.sin(2 * np.pi * s), nrm)


def vine(t, path, width, layer):
    t.line(path, width, layer)
    t.line(path, width * 0.36, layer, erase=True)


def tangent_at(path, i):
    j = min(i + 1, len(path) - 1)
    v = path[j] - path[max(0, j - 1)]
    return math.atan2(v[1], v[0])


# ── flowers ────────────────────────────────────────────────────────────────

def leaf(t, x, y, L, W, ang, bend=0.25, z=0.0, layer="leaf"):
    """A leaf with a carved midrib and a few veins."""
    poly, rib = leaf_shape(L, W, bend)
    t.poly(xf(poly, x, y, ang), layer, axis=((x, y), tuple(xf(rib[-1], x, y, ang))), alpha=(1.0, 0.75), dome=0.7, z=z)
    t.line(xf(rib[4:-8], x, y, ang), max(1.0, W * 0.06), layer, erase=True)
    for s in (0.3, 0.5, 0.7):
        i = int(s * 99)
        for sg in (1, -1):
            v0 = rib[i]
            v1 = v0 + np.array([L * 0.14, sg * W * 0.36])
            t.line(xf(np.array([v0, v1]), x, y, ang), max(0.8, W * 0.035), layer, erase=True)


def lotus_bloom(t, x, y, k, ang=UP):
    """An open lotus from the side: back petals fanned, the seed pod, then the
    front petals cupped round it; pink at the tips, pale at the base."""
    pk = lambda h, w, a, dx, z, al=(0.3, 1.0): t.poly(
        xf(petal(h, w, sharp=1.2), *xf(np.array([dx, 0.0]), x, y, ang + math.pi / 2, k), ang + a, k), "petal",
        axis=(tuple(xf(np.array([dx, 0.0]), x, y, ang + math.pi / 2, k)),
              tuple(xf(np.array([dx, 0.0]), x, y, ang + math.pi / 2, k) + h * k * np.array([math.cos(ang + a), math.sin(ang + a)]))),
        alpha=al, dome=0.9, z=z, veins=5)
    for a, h in ((-1.25, 86), (1.25, 86), (-0.85, 100), (0.85, 100), (-0.42, 110), (0.42, 110)):
        pk(h, 44, a, 0, 0.0, (0.05, 0.85))
    # the seed pod
    pod = xf(np.array([[-16, -60], [16, -60], [12, -48], [-12, -48]]), x, y, ang + math.pi / 2, k)
    t.poly(pod, "heart", z=0.3)
    for a, h, dx in ((-0.62, 96, -8), (0.62, 96, 8), (-0.22, 104, -4), (0.22, 104, 4)):
        pk(h, 50, a, dx, 0.45, (0.08, 1.0))
    pk(100, 54, 0.0, 0, 0.7, (0.1, 1.0))
    for a in (-0.22, 0.22, 0.0):
        t.line(xf(np.array([[16, 0], [80, 0]]), x, y, ang + a, k), 1.6 * k, "petal", erase=True)


def lotus_pad(t, x, y, r, rot=0.0):
    a = np.linspace(0.18, 2 * np.pi - 0.18, 90) + rot
    pts = np.stack([x + np.cos(a) * r, y + np.sin(a) * r * 0.62], 1)
    pts = np.concatenate([pts, [[x, y]]])
    t.poly(pts, "leaf", axis=((x, y), (x + r * 0.7, y - r * 0.4)), alpha=(0.95, 0.7), dome=0.6)
    for i in range(9):
        b = rot + 0.5 + i * (2 * np.pi - 1.0) / 8
        t.line(np.array([[x, y], [x + math.cos(b) * r * 0.85, y + math.sin(b) * r * 0.85 * 0.62]]), max(1.0, r * 0.025), "leaf", erase=True)


def rumduol(t, x, y, r, rot=0.0):
    """Cambodia's rumduol: three thick outer petals, three cupped inner petals
    closing over the heart, sepals between."""
    for i in range(3):
        a = rot + i * 2 * np.pi / 3 + np.pi / 3
        t.poly(xf(petal(r * 0.55, r * 0.36), x, y, a), "leaf", z=0.0)
    for i in range(3):
        a = rot + i * 2 * np.pi / 3
        t.poly(xf(round_petal(r, r * 0.92), x, y, a), "petal",
               axis=((x, y), (x + math.cos(a) * r, y + math.sin(a) * r)), alpha=(1.0, 0.7), dome=1.0, z=0.2, veins=3)
    for i in range(3):
        a = rot + i * 2 * np.pi / 3 + np.pi / 3
        t.poly(xf(round_petal(r * 0.56, r * 0.62), x, y, a), "heart",
               axis=((x, y), (x + math.cos(a) * r * 0.56, y + math.sin(a) * r * 0.56)), alpha=(1.0, 0.8), dome=1.2, z=0.55)
    t.dot(x, y, r * 0.1, "heart", z=0.9)


def champa(t, x, y, r, rot=0.0):
    """A frangipani: five broad petals overlapping in a pinwheel, the yellow
    heart running out along each from the centre."""
    for i in range(5):
        a = rot + i * 2 * np.pi / 5
        t.poly(xf(round_petal(r, r * 0.66, skew=0.22), x, y, a), "petal",
               axis=((x, y), (x + math.cos(a) * r, y + math.sin(a) * r)), alpha=(0.55, 1.0), dome=0.9, z=0.08 * i, veins=4)
        t.line(xf(np.array([[r * 0.25, r * 0.06], [r * 0.85, r * 0.2]]), x, y, a), max(0.8, r * 0.03), "petal", erase=True)
    for i in range(5):
        a = rot + i * 2 * np.pi / 5 + 0.15
        t.poly(xf(petal(r * 0.5, r * 0.3), x, y, a), "heart",
               axis=((x, y), (x + math.cos(a) * r * 0.5, y + math.sin(a) * r * 0.5)), alpha=(1.0, 0.0), dome=0.4, z=0.5)
    t.dot(x, y, r * 0.07, "heart", z=0.8)


def jasmine(t, x, y, r, rot=0.0, n=6):
    for i in range(n):
        a = rot + i * 2 * np.pi / n
        t.poly(xf(round_petal(r, r * 0.42), x, y, a), "petal",
               axis=((x, y), (x + math.cos(a) * r, y + math.sin(a) * r)), alpha=(0.7, 1.0), dome=0.8, z=0.05 * (i % 2))
    t.dot(x, y, r * 0.16, "heart", z=0.6)


def jasmine_bud(t, x, y, L, ang):
    t.line(np.array([[x, y], [x + math.cos(ang) * L * 0.5, y + math.sin(ang) * L * 0.5]]), max(1.0, L * 0.06), "leaf")
    bx, by = x + math.cos(ang) * L * 0.45, y + math.sin(ang) * L * 0.45
    t.poly(xf(bud_petal(L * 0.6, L * 0.26), bx, by, ang), "petal",
           axis=((bx, by), (bx + math.cos(ang) * L * 0.6, by + math.sin(ang) * L * 0.6)), alpha=(0.6, 1.0), dome=1.0, z=0.2)


def rose(t, x, y, r, rot=0.0):
    """A rose from above: rings of notched petals, each ring deeper in colour
    and higher than the one outside it, the centre a tight spiral."""
    rings = ((1.0, 6, 0.0, "petal", (0.6, 1.0)), (0.78, 5, 0.4, "petal", (0.7, 1.0)),
             (0.56, 5, 0.9, "heart", (0.6, 1.0)), (0.36, 4, 0.3, "heart", (0.8, 1.0)))
    for ri, (rr, n, off, layer, al) in enumerate(rings):
        for i in range(n):
            a = rot + off + i * 2 * np.pi / n
            t.poly(xf(round_petal(r * rr, r * rr * 0.95, notch=0.08), x, y, a), layer,
                   axis=((x, y), (x + math.cos(a) * r * rr, y + math.sin(a) * r * rr)), alpha=al, dome=1.0, z=0.3 * ri, veins=3 if ri < 2 else 0)
    s = np.linspace(0, 4 * np.pi, 120)
    spiral = np.stack([x + np.cos(s + rot) * r * 0.2 * s / (4 * np.pi), y + np.sin(s + rot) * r * 0.2 * s / (4 * np.pi)], 1)
    t.line(spiral, max(1.0, r * 0.03), "heart", erase=True)


def rosebud(t, x, y, L, ang):
    t.line(np.array([[x, y], [x + math.cos(ang) * L * 0.5, y + math.sin(ang) * L * 0.5]]), max(1.2, L * 0.07), "leaf")
    bx, by = x + math.cos(ang) * L * 0.45, y + math.sin(ang) * L * 0.45
    for sg in (1, -1):
        t.poly(xf(petal(L * 0.3, L * 0.14), bx, by, ang + sg * 0.6), "leaf")
    t.poly(xf(bud_petal(L * 0.62, L * 0.4), bx, by, ang), "heart",
           axis=((bx, by), (bx + math.cos(ang) * L * 0.62, by + math.sin(ang) * L * 0.62)), alpha=(1.0, 0.7), dome=1.1, z=0.3)


# ── more flowers ────────────────────────────────────────────────────────────

def daisy(t, x, y, r, rot=0.0, n=16):
    """A daisy: a ring of long, narrow white rays, alternately a hair higher,
    round a domed golden disc of florets."""
    for i in range(n):
        a = rot + i * 2 * np.pi / n
        t.poly(xf(round_petal(r, r * 0.24), x, y, a), "petal",
               axis=((x, y), (x + math.cos(a) * r, y + math.sin(a) * r)), alpha=(0.75, 1.0), dome=0.6, z=0.06 * (i % 2), veins=1)
    t.poly(circle(r * 0.3) + [x, y], "heart", axis=((x, y + r * 0.3), (x, y - r * 0.3)), alpha=(1.0, 0.85), dome=1.4, z=0.5)
    for i in range(14):
        a = i * 2.39996
        rr = r * 0.26 * math.sqrt((i + 0.5) / 14)
        t.groove(np.array([[x + math.cos(a) * rr - 0.6, y + math.sin(a) * rr], [x + math.cos(a) * rr + 0.6, y + math.sin(a) * rr]]), max(0.8, r * 0.03), 0.1)


def sakura(t, x, y, r, rot=0.0):
    """A cherry blossom: five notched petals, flushed deeper at the base,
    with a spray of fine stamens."""
    for i in range(5):
        a = rot + i * 2 * np.pi / 5
        t.poly(xf(round_petal(r, r * 0.82, notch=0.14), x, y, a), "petal",
               axis=((x, y), (x + math.cos(a) * r, y + math.sin(a) * r)), alpha=(1.0, 0.45), dome=0.8, z=0.04 * i, veins=3)
    for i in range(10):
        a = rot + i * 2 * np.pi / 10 + 0.2
        L = r * (0.42 + 0.12 * (i % 2))
        t.line(np.array([[x, y], [x + math.cos(a) * L, y + math.sin(a) * L]]), max(0.6, r * 0.03), "heart", z=0.6)
        t.dot(x + math.cos(a) * L, y + math.sin(a) * L, max(0.8, r * 0.06), "heart", z=0.7)


def orchid(t, x, y, r, rot=0.0):
    """A moth orchid face on: three pointed sepals behind, two broad round
    petals either side, and the lip in the heart colour at the centre."""
    up = rot + UP
    for a in (up, up + 2.3, up - 2.3):
        t.poly(xf(petal(r * 0.95, r * 0.5, sharp=0.9), x, y, a), "petal",
               axis=((x, y), (x + math.cos(a) * r, y + math.sin(a) * r)), alpha=(0.9, 0.7), dome=0.6, veins=3)
    for a in (up + 1.35, up - 1.35):
        t.poly(xf(round_petal(r * 0.95, r * 1.0), x, y, a), "petal",
               axis=((x, y), (x + math.cos(a) * r, y + math.sin(a) * r)), alpha=(1.0, 0.75), dome=0.8, z=0.3, veins=5)
    lip = up + math.pi
    t.poly(xf(round_petal(r * 0.55, r * 0.42, notch=0.2), x, y + 0.0, lip), "heart",
           axis=((x, y), (x + math.cos(lip) * r * 0.55, y + math.sin(lip) * r * 0.55)), alpha=(1.0, 0.8), dome=1.0, z=0.6)
    t.dot(x, y, r * 0.1, "heart", z=0.8)


def peony(t, x, y, r, rot=0.0, seed=1):
    """A peony: ruffled rings of notched petals, each ring jittered, the
    inner rings deeper and higher."""
    rng = np.random.default_rng(seed)
    rings = ((1.0, 9, "petal", (0.55, 1.0)), (0.82, 8, "petal", (0.6, 1.0)), (0.64, 8, "petal", (0.7, 1.0)),
             (0.46, 7, "heart", (0.6, 1.0)), (0.3, 5, "heart", (0.8, 1.0)))
    for ri, (rr, n, layer, al) in enumerate(rings):
        for i in range(n):
            a = rot + i * 2 * np.pi / n + rng.uniform(-0.15, 0.15) + ri * 0.35
            k = rr * rng.uniform(0.9, 1.06)
            t.poly(xf(round_petal(r * k, r * k * 0.82, notch=0.1, skew=rng.uniform(-0.1, 0.1)), x, y, a), layer,
                   axis=((x, y), (x + math.cos(a) * r * k, y + math.sin(a) * r * k)), alpha=al, dome=1.0, z=0.25 * ri, veins=4 if ri < 3 else 0)


def camellia(t, x, y, r, rot=0.0):
    """A camellia: clean, rounded petals in three overlapping rings and a
    little crown of golden stamens."""
    for ri, (rr, n) in enumerate(((1.0, 6), (0.74, 6), (0.5, 5))):
        for i in range(n):
            a = rot + i * 2 * np.pi / n + ri * 0.5
            t.poly(xf(round_petal(r * rr, r * rr * 0.98), x, y, a), "petal",
                   axis=((x, y), (x + math.cos(a) * r * rr, y + math.sin(a) * r * rr)), alpha=(1.0, 0.82), dome=1.0, z=0.3 * ri, veins=3)
    for i in range(12):
        a = i * 2 * np.pi / 12
        t.dot(x + math.cos(a) * r * 0.16, y + math.sin(a) * r * 0.16, max(1.0, r * 0.05), "heart", z=1.0)
    t.dot(x, y, r * 0.08, "heart", z=1.0)


def forget_me_not(t, x, y, r, rot=0.0):
    for i in range(5):
        a = rot + i * 2 * np.pi / 5
        t.poly(xf(round_petal(r, r * 0.92), x, y, a), "petal",
               axis=((x, y), (x + math.cos(a) * r, y + math.sin(a) * r)), alpha=(0.85, 1.0), dome=0.6, z=0.03 * i)
    t.dot(x, y, r * 0.24, "heart", z=0.5)


def branch(t, pts, width, layer="leaf"):
    """A woody branch: a line that thins toward its tip."""
    pts = np.asarray(pts, float)
    n = len(pts) - 1
    for i in range(n):
        w = width * (1 - 0.6 * i / max(1, n))
        t.line(pts[i:i + 2], w, layer)


def stem_curve(x, y, L, ang, bend=0.4, n=40):
    s = np.linspace(0, 1, n)
    a = ang + bend * s
    dx = np.cumsum(np.cos(a)) * L / n
    dy = np.cumsum(np.sin(a)) * L / n
    return np.stack([x + dx, y + dy], 1)


def bud(t, x, y, L, ang, layer="petal"):
    t.poly(xf(bud_petal(L, L * 0.5), x, y, ang), layer,
           axis=((x, y), (x + math.cos(ang) * L, y + math.sin(ang) * L)), alpha=(0.8, 1.0), dome=1.0, z=0.2)
    for sg in (1, -1):
        t.poly(xf(petal(L * 0.45, L * 0.2), x, y, ang + sg * 0.5), "leaf", z=0.3)


# ── patterns ───────────────────────────────────────────────────────────────

def damask():
    T = 840
    t = Tile(T)
    c = T / 2
    for x0, y0 in ((0, 0), (T, 0), (0, T), (T, T)):
        v = np.array([c - x0, c - y0]) / math.hypot(c - x0, c - y0)
        path = vine_path(np.array([x0, y0]) + v * 120, np.array([c, c]) - v * 175, 18)
        vine(t, path, 8, "blind")
        for sj, sg in ((0.16, 1), (0.3, -1), (0.46, 1), (0.6, -1), (0.8, 1)):
            i = int(sj * 199)
            a = tangent_at(path, i)
            leaf(t, *path[i], 62, 24, a + sg * 0.8)
        i = int(0.38 * 199)
        jasmine(t, *path[i], 20, rot=0.3)
        i = int(0.7 * 199)
        champa(t, *path[i], 26, rot=1.1)
        i = int(0.55 * 199)
        jasmine_bud(t, *path[i], 44, tangent_at(path, i) - 1.0)
        i = int(0.24 * 199)
        jasmine_bud(t, *path[i], 40, tangent_at(path, i) + 1.0)
    for a, k in ((UP, 1.0), (-UP, 1.0), (0.0, 0.74), (math.pi, 0.74)):
        spray(t, c, c, a, k, "foil")
    for a in (UP + math.pi / 4, UP - math.pi / 4, -UP + math.pi / 4, -UP - math.pi / 4):
        d = np.array([math.cos(a), math.sin(a)])
        leaf(t, *(np.array([c, c]) + d * 54), 70, 28, a, z=0.1)
    # the lotus at the heart of the medallion, open, seen from above
    for i in range(8):
        a = i * np.pi / 4 + np.pi / 8
        t.poly(xf(petal(66, 40, sharp=1.1), c, c, a), "petal", axis=((c, c), (c + math.cos(a) * 66, c + math.sin(a) * 66)), alpha=(0.05, 1.0), dome=0.9, veins=5)
    for i in range(8):
        a = i * np.pi / 4
        t.poly(xf(petal(50, 30, sharp=1.1), c, c, a), "petal", axis=((c, c), (c + math.cos(a) * 50, c + math.sin(a) * 50)), alpha=(0.08, 1.0), dome=0.9, z=0.3, veins=4)
    t.dot(c, c, 15, "heart", z=0.6)
    for i in range(7):
        a = 2 * np.pi * i / 7
        t.poly(circle(2.2) + [c + math.cos(a) * 8, c + math.sin(a) * 8], "heart", erase=True)
    # the half-drop: rumduol among four short sprays
    for a in (UP, -UP, 0.0, math.pi):
        spray(t, 0, 0, a, 0.52, "blind")
    for a in (0.6, 2.2, 3.8, 5.4):
        leaf(t, 0, 0, 64, 26, a)
    rumduol(t, 0, 0, 44, rot=UP)
    for x, y in ((c, 0), (0, c)):
        for a in (0.3, 1.9, 3.5, 5.0):
            leaf(t, x, y, 50, 20, a)
        champa(t, x, y, 34, rot=0.3)
    return t


def silk():
    T = 600
    t = Tile(T)
    h = T / 2
    sides = (((0, h), (h, 0)), ((h, 0), (T, h)), ((T, h), (h, T)), ((h, T), (0, h)))
    for off in (-7, 7):
        for (x0, y0), (x1, y1) in sides:
            d = np.array([x1 - x0, y1 - y0], float)
            u = d / np.hypot(*d)
            n = np.array([-u[1], u[0]])
            p = np.array([[x0, y0], [x1, y1]]) + n * off
            t.line(np.array([p[0] - u * 40, p[1] + u * 40]), 4.2, "blind")
    for (x0, y0), (x1, y1) in sides:
        for i in range(1, 8):
            s = i / 8
            t.dot(x0 + (x1 - x0) * s, y0 + (y1 - y0) * s, 2.2, "blind")
    for x, y in ((h, 0), (0, h)):
        rosette(t, x, y, 34, "foil", rings=1)
    for (x, y, k) in ((h, h + 40, 1.0), (0, 40, 0.82)):
        for sg in (1, -1):
            t.shape(MID, "foil", x + sg * 20 * k, y + 52 * k, ang=(0.0 if sg > 0 else math.pi) - sg * 0.35, k=k * 0.92, flip=sg < 0)
            leaf(t, x + sg * 10 * k, y + 20 * k, 50 * k, 20 * k, UP + sg * 1.0, z=0.1)
        lotus_bloom(t, x, y + 6 * k, 0.62 * k)
        t.line(np.array([[x, y + 6 * k], [x, y + 60 * k]]), 5 * k, "leaf")
    return t


def kbach_wave(t, y, T, amp, layer, k=1.0, phase=0.0):
    """A band of kbach water: a sinuous line with scroll leaves rolling off
    it at every crest and trough, carried right across the tile."""
    n = 4
    xs = np.linspace(0, T, 300)
    ys = y + amp * np.sin(2 * np.pi * n * xs / T + phase)
    path = np.stack([xs, ys], 1)
    t.line(np.concatenate([[path[0] - [12, 0]], path, [path[-1] + [12, 0]]]), 4 * k, layer)
    for i in range(n * 2):
        x = (i + 0.25) * T / (n * 2) - phase * T / (2 * np.pi * n)
        x %= T
        crest = i % 2 == 0
        yy = y + amp * np.sin(2 * np.pi * n * x / T + phase)
        t.shape(SMALL, layer, x, yy, ang=0.0 if crest else math.pi, k=0.9 * k, flip=not crest)


def rumduol_cluster(t, cx, cy, k=1.0):
    for a in (UP + 0.75, UP - 0.75, UP + 1.6, UP - 1.6, -UP + 0.45, -UP - 0.45, -UP + 1.3, -UP - 1.3):
        leaf(t, cx, cy, 78 * k, 30 * k, a)
    for a in (UP + 0.35, UP - 0.35):
        jasmine_bud(t, cx + math.cos(a) * 46 * k, cy + math.sin(a) * 46 * k, 36 * k, a)
    rumduol(t, cx, cy - 24 * k, 34 * k, rot=UP)
    rumduol(t, cx - 42 * k, cy + 16 * k, 28 * k, rot=UP + 0.5)
    rumduol(t, cx + 42 * k, cy + 16 * k, 28 * k, rot=UP - 0.5)
    rumduol(t, cx - 6 * k, cy + 46 * k, 22 * k, rot=-UP + 0.3)


def rumduol_trellis():
    T = 640
    t = Tile(T)
    h = T / 2
    for x0 in (0, T):
        for (ya, yb) in ((0, h), (h, T)):
            for path in (vine_path((x0, ya), (h, yb), 34), vine_path((h, ya), (x0, yb), 34)):
                vine(t, path, 5, "foil")
                for sj, sg in ((0.3, 1), (0.7, -1)):
                    i = int(sj * 199)
                    leaf(t, *path[i], 40, 16, tangent_at(path, i) + sg * 0.7)
                i = int(0.5 * 199)
                jasmine(t, *path[i], 12, rot=0.4)
    for x, y in ((0, 0), (h, h), (0, T), (T, 0), (T, T)):
        rosette(t, x, y, 24, "foil", rings=1)
    for (cx, cy) in ((h, 0), (0, h)):
        rumduol_cluster(t, cx, cy, 1.05)
    return t


def champa_pattern():
    T = 720
    t = Tile(T)
    for (cx, cy, rot) in ((200, 220, 0.2), (560, 580, 2.1)):
        for a in (rot + 0.4, rot + 1.3, rot + 2.2, rot + 3.1, rot + 4.3, rot + 5.4):
            leaf(t, cx, cy, 120, 38, a, bend=0.15)
        champa(t, cx - 34, cy - 12, 42, rot=rot)
        champa(t, cx + 38, cy + 6, 38, rot=rot + 1.1)
        champa(t, cx - 4, cy + 50, 34, rot=rot + 2.3)
        champa(t, cx + 20, cy - 58, 28, rot=rot + 0.6)
        for a in (rot + 3.6, rot + 1.0, rot + 4.8):
            jasmine_bud(t, cx + math.cos(a) * 70, cy + math.sin(a) * 70, 40, a)
    for (x, y, a) in ((560, 200, UP), (200, 560, -UP)):
        spray(t, x, y + 80 * (1 if a == UP else -1), a, 0.7, "foil")
        rosette(t, x, y + 80 * (1 if a == UP else -1), 14, "foil", rings=1)
    for (x, y) in ((0, 0), (0, T / 2), (T / 2, 0)):
        rosette(t, x, y, 18, "foil", rings=1)
        for i in range(4):
            a = i * np.pi / 2 + np.pi / 4
            t.shape(SMALL, "blind", x + math.cos(a) * 18, y + math.sin(a) * 18, ang=a, k=0.7)
    return t


def rose_pattern():
    T = 720
    t = Tile(T)
    c = T / 2
    for a in (0.0, math.pi / 2, math.pi, -math.pi / 2):
        for sg in (1, -1):
            t.shape(BIG, "foil", c + math.cos(a) * 96, c + math.sin(a) * 96, ang=a + sg * 1.25, k=0.7, flip=sg > 0)
        d = np.array([math.cos(a), math.sin(a)])
        t.shape(CROWN, "foil", *(np.array([c, c]) + d * 156), ang=a + math.pi, k=0.58)
    for a in (math.pi / 4, 3 * math.pi / 4, -math.pi / 4, -3 * math.pi / 4):
        leaf(t, c + math.cos(a) * 42, c + math.sin(a) * 42, 64, 26, a)
        rosebud(t, c + math.cos(a) * 70, c + math.sin(a) * 70, 52, a)
    rose(t, c, c, 62, rot=0.2)
    # the half-drop: a spray of a rose, buds and leaves
    for a in (0.2, 1.0, 1.8, 2.6, 3.4, 4.2, 5.0, 5.8):
        leaf(t, 0, 0, 70, 28, a)
    for a in (UP + 0.4, UP + 2.4, UP - 1.7, -UP + 0.6):
        rosebud(t, 0, 0, 92, a)
    rose(t, 0, 0, 40, rot=1.0)
    for (x, y) in ((c, 0), (0, c)):
        for a in (0.0, math.pi / 2, math.pi, -math.pi / 2):
            leaf(t, x, y, 34, 14, a + math.pi / 4)
        rose(t, x, y, 18, rot=0.6)
    rng = np.random.default_rng(9)
    for _ in range(70):
        x, y = rng.uniform(0, T, 2)
        if math.hypot(x - c, y - c) > 200 and math.hypot(min(x, T - x), min(y, T - y)) > 140:
            t.dot(x, y, rng.uniform(1.5, 2.4), "blind")
    return t


def jasmine_net():
    T = 560
    t = Tile(T)
    h = T / 2
    sides = (((0, h), (h, 0)), ((h, 0), (T, h)), ((T, h), (h, T)), ((h, T), (0, h)))
    for (x0, y0), (x1, y1) in sides:
        path = vine_path((x0, y0), (x1, y1), 10)
        vine(t, path, 4, "foil")
        for sj, sg in ((0.25, 1), (0.5, -1), (0.75, 1)):
            i = int(sj * 199)
            a = tangent_at(path, i)
            t.shape(SMALL, "foil", *path[i], ang=a + sg * 0.5, k=0.8, flip=sg > 0)
    for x, y in ((h, 0), (0, h)):
        for i in range(4):
            a = i * np.pi / 2
            leaf(t, x, y, 40, 15, a + np.pi / 4)
        jasmine(t, x, y, 22, rot=0.2, n=8)
    for (x, y) in ((h, h), (0, 0)):
        for a in (UP + 0.6, UP - 0.6, -UP + 0.9, -UP - 0.9, 0.0, math.pi):
            leaf(t, x, y, 56, 20, a)
        jasmine(t, x, y - 10, 24, rot=0.4)
        jasmine(t, x - 34, y + 22, 18, rot=1.0)
        jasmine(t, x + 34, y + 22, 18, rot=0.1)
        for a in (UP + 0.3, UP - 0.3, -UP):
            jasmine_bud(t, x + math.cos(a) * 36, y + math.sin(a) * 36, 34, a)
    rng = np.random.default_rng(21)
    for _ in range(40):
        px, py = rng.uniform(0, T, 2)
        t.dot(px, py, rng.uniform(1.2, 2.0), "foil")
    return t


# ════ the Khmer papers: kbach alone, in foil and blind emboss ═══════════════

def kbach_damask():
    T = 840
    t = Tile(T)
    c = T / 2
    for x0, y0 in ((0, 0), (T, 0), (0, T), (T, T)):
        v = np.array([c - x0, c - y0]) / math.hypot(c - x0, c - y0)
        path = vine_path(np.array([x0, y0]) + v * 120, np.array([c, c]) - v * 175, 18)
        vine(t, path, 8, "blind")
        for sj, sg in ((0.2, 1), (0.42, -1), (0.64, 1), (0.84, -1)):
            i = int(sj * 199)
            t.shape(SMALL, "blind", *path[i], ang=tangent_at(path, i) + sg * 0.8, k=0.9, flip=sg > 0)
    for a, k in ((UP, 1.0), (-UP, 1.0), (0.0, 0.74), (math.pi, 0.74)):
        spray(t, c, c, a, k, "foil")
    rosette(t, c, c, 60, "foil")
    for a in (UP, -UP, 0.0, math.pi):
        spray(t, 0, 0, a, 0.52, "blind")
    rosette(t, 0, 0, 36, "foil", a0=np.pi / 8)
    for x, y in ((c, 0), (0, c)):
        rosette(t, x, y, 22, "blind", rings=1)
    return t


def kbach_medallion():
    T = 560
    t = Tile(T)
    h = T / 2
    for (x, y, k) in ((h, h, 1.0), (0, 0, 0.8)):
        rosette(t, x, y, 34 * k, "foil")
        for i in range(8):
            a = i * np.pi / 4
            t.shape(SMALL, "foil", x + math.cos(a) * 40 * k, y + math.sin(a) * 40 * k, ang=a, k=0.72 * k, flip=i % 2 == 0)
        for i in range(24):
            a = i * 2 * np.pi / 24
            t.dot(x + math.cos(a) * 112 * k, y + math.sin(a) * 112 * k, 2.0 * k, "blind")
    for x, y in ((h, 0), (0, h)):
        for i in range(4):
            t.poly(xf(petal(26, 18), x, y, i * np.pi / 2 + np.pi / 4), "blind")
        t.dot(x, y, 5, "blind")
    return t


def phka_chan():
    T = 480
    t = Tile(T)
    h = T / 2
    for (x0, y0), (x1, y1) in (((0, 0), (T, T)), ((T, 0), (0, T))):
        t.line(np.array([[x0, y0], [x1, y1]]), 1.8, "blind")
        for i in range(1, 12):
            s = i / 12
            t.dot(x0 + (x1 - x0) * s, y0 + (y1 - y0) * s, 1.8, "blind")
    for (x, y, k) in ((0, 0, 1.0), (h, h, 1.0)):
        # the four-petalled kbach flower, with a hook between each petal
        for i in range(4):
            a = i * np.pi / 2
            t.poly(xf(petal(58 * k, 40 * k, sharp=1.3), x, y, a), "foil",
                   axis=((x, y), (x + math.cos(a) * 58 * k, y + math.sin(a) * 58 * k)), dome=0.8, veins=3)
            t.shape(SMALL, "foil", x + math.cos(a + np.pi / 4) * 22 * k, y + math.sin(a + np.pi / 4) * 22 * k, ang=a + np.pi / 4, k=0.55 * k)
        t.poly(circle(14 * k) + [x, y], "foil", erase=True)
        t.dot(x, y, 10 * k, "foil", z=0.4)
    for (x, y) in ((h, 0), (0, h)):
        t.poly(np.array([[x, y - 16], [x + 16, y], [x, y + 16], [x - 16, y]]), "blind")
        t.dot(x, y, 4, "blind", z=0.3)
    return t


def phni_waves():
    T = 600
    t = Tile(T)
    for i, y in enumerate((100, 300, 500)):
        kbach_wave(t, y, T, 16, "foil", phase=i * np.pi / 3)
    for y in (200, 400, 0):
        for j in range(6):
            x = j * T / 6 + (T / 12 if y == 200 else 0)
            t.shape(CROWN, "blind", x, y + 20, ang=UP + math.pi, k=0.32)
            t.dot(x, y + 26, 3, "blind")
    return t


def kanok():
    T = 600
    t = Tile(T)
    for row, y in enumerate((T / 6, T / 2, 5 * T / 6)):
        xs = np.linspace(-20, T + 20, 400)
        ys = y + 40 * np.sin(2 * np.pi * 2 * xs / T + row * np.pi)
        path = np.stack([xs, ys], 1)
        vine(t, path, 6, "blind")
        for j in range(8):
            x = (j + 0.25) * T / 8
            i = int(np.argmin(np.abs(xs - x)))
            a = tangent_at(path, i)
            sg = 1 if j % 2 == 0 else -1
            t.shape(MID, "foil", *path[i], ang=a + sg * 0.95, k=0.7, flip=sg > 0)
            t.shape(SMALL, "blind", *path[i], ang=a - sg * 1.6, k=0.55, flip=sg < 0)
            t.dot(*(path[i] + np.array([0, -sg * 34])), 2.8, "foil")
    return t


def lintel():
    T = 760
    t = Tile(T)
    for (y, off) in ((190, 0.0), (570, T / 2)):
        for dy in (-56, 56):
            t.line(np.array([[-10, y + dy], [T + 10, y + dy]]), 2.4, "blind")
            for j in range(40):
                t.dot(j * T / 40, y + dy + (8 if dy > 0 else -8), 1.6, "blind")
        cx = (T / 2 + off) % T
        rosette(t, cx, y, 34, "foil")
        for sg in (1, -1):
            for j in range(4):
                x = cx + sg * (60 + j * 46)
                t.shape(SMALL, "foil", x, y + (8 if j % 2 else -8), ang=0.0 if sg > 0 else math.pi, k=0.75, flip=j % 2 == 0)
        for j in range(4):
            x = (cx + T / 4 + j * T / 4) % T
            if abs(((x - cx + T / 2) % T) - T / 2) < 40:
                continue
            t.shape(CROWN, "foil", x, y + 58, ang=-UP + math.pi, k=0.36)
            t.dot(x, y + 58, 4, "foil")
    # between the friezes, a quiet diaper of small kbach flowers
    for (y, off) in ((380, 0.0), (0, T / 2)):
        for j in range(4):
            x = (j * T / 4 + T / 8 + off) % T
            for i in range(4):
                t.poly(xf(petal(18, 13), x, y, i * np.pi / 2 + np.pi / 4), "blind")
            t.dot(x, y, 3.4, "foil")
    return t


def star_net():
    T = 520
    t = Tile(T)
    h = T / 2
    sides = (((0, h), (h, 0)), ((h, 0), (T, h)), ((T, h), (h, T)), ((h, T), (0, h)))
    for (x0, y0), (x1, y1) in sides:
        path = vine_path((x0, y0), (x1, y1), 8)
        vine(t, path, 3.5, "blind")
        for sj, sg in ((0.3, 1), (0.7, -1)):
            i = int(sj * 199)
            t.shape(SMALL, "foil", *path[i], ang=tangent_at(path, i) + sg * 0.5, k=0.7, flip=sg > 0)
    for (x, y, k) in ((h, 0, 1.0), (0, h, 1.0), (h, h, 1.2), (0, 0, 1.2)):
        for i in range(8):
            a = i * np.pi / 4
            t.shape(CROWN, "foil", x + math.cos(a) * 8 * k, y + math.sin(a) * 8 * k, ang=a + math.pi, k=0.3 * k)
        rosette(t, x, y, 16 * k, "foil", rings=1)
    return t


def ogee_kbach():
    T = 640
    t = Tile(T)
    h = T / 2
    for x0 in (0, T):
        for (ya, yb) in ((0, h), (h, T)):
            for path in (vine_path((x0, ya), (h, yb), 34), vine_path((h, ya), (x0, yb), 34)):
                vine(t, path, 5, "foil")
                for sj, sg in ((0.3, 1), (0.7, -1)):
                    i = int(sj * 199)
                    t.shape(SMALL, "blind", *path[i], ang=tangent_at(path, i) + sg * 0.7, k=0.7, flip=sg > 0)
    for x, y in ((0, 0), (h, h), (0, T), (T, 0), (T, T)):
        rosette(t, x, y, 22, "foil", rings=1)
    for (cx, cy) in ((h, 0), (0, h)):
        spray(t, cx, cy + 6, UP, 0.5, "foil")
        spray(t, cx, cy - 6, -UP, 0.5, "foil")
        rosette(t, cx, cy, 16, "foil", rings=1)
    return t


def hol_ikat():
    T = 480
    t = Tile(T)
    for band in range(4):
        y0 = band * T / 4 + 30
        for off in (0, 10, 20):
            xs = np.linspace(-10, T + 10, 9)
            ys = y0 + off + np.where(np.arange(9) % 2 == 0, 0, 34)
            t.line(np.stack([xs, ys], 1), 2.2 if off != 10 else 3.4, "blind" if off != 10 else "foil")
        for j in range(8):
            x = j * T / 8
            if j % 2 == 0:
                t.shape(SMALL, "foil", x, y0 - 18, ang=UP, k=0.45)
            else:
                t.poly(np.array([[x, y0 + 52], [x + 9, y0 + 62], [x, y0 + 72], [x - 9, y0 + 62]]), "blind")
    return t


def kbach_silk():
    T = 600
    t = Tile(T)
    h = T / 2
    sides = (((0, h), (h, 0)), ((h, 0), (T, h)), ((T, h), (h, T)), ((h, T), (0, h)))
    for off in (-7, 7):
        for (x0, y0), (x1, y1) in sides:
            d = np.array([x1 - x0, y1 - y0], float)
            u = d / np.hypot(*d)
            n = np.array([-u[1], u[0]])
            p = np.array([[x0, y0], [x1, y1]]) + n * off
            t.line(np.array([p[0] - u * 40, p[1] + u * 40]), 4.2, "blind")
    for (x0, y0), (x1, y1) in sides:
        for i in range(1, 8):
            t.dot(x0 + (x1 - x0) * i / 8, y0 + (y1 - y0) * i / 8, 2.2, "blind")
    for x, y in ((h, 0), (0, h)):
        rosette(t, x, y, 34, "foil", rings=1)
    for (x, y, k) in ((h, h + 60, 1.0), (0, 60, 0.82)):
        spray(t, x, y, UP, 0.7 * k, "foil")
    return t


# ════ the flower papers: botanical, printed in colour and embossed ══════════

def rose_bouquet():
    T = 720
    t = Tile(T)
    for (cx, cy, rot) in ((190, 210, 0.3), (550, 570, 2.2)):
        for a in np.linspace(rot, rot + 2 * np.pi, 9)[:-1]:
            leaf(t, cx, cy, 92, 36, a, bend=0.2)
        for a in (rot + 0.9, rot + 2.8, rot + 4.6):
            rosebud(t, cx, cy, 120, a)
        rose(t, cx - 30, cy - 12, 52, rot=rot)
        rose(t, cx + 36, cy + 18, 40, rot=rot + 1.3)
        rose(t, cx - 4, cy + 52, 32, rot=rot + 2.0)
    for (cx, cy) in ((550, 190), (190, 550)):
        for a in (0.5, 2.2, 3.9, 5.5):
            leaf(t, cx, cy, 52, 20, a)
        rose(t, cx, cy, 26, rot=0.7)
    return t


def daisy_meadow():
    T = 640
    t = Tile(T)
    rng = np.random.default_rng(31)
    spots = [(80, 120), (300, 70), (520, 150), (180, 330), (420, 360), (610, 420), (90, 540), (320, 560), (520, 610)]
    for i, (x, y) in enumerate(spots):
        r = rng.uniform(22, 36)
        ang = -UP + rng.uniform(-0.6, 0.6)
        path = stem_curve(x, y, r * 2.6, ang, bend=rng.uniform(-0.5, 0.5))
        t.line(path, 3, "leaf")
        for s in (0.45, 0.75):
            j = int(s * (len(path) - 1))
            a = tangent_at(path, j)
            leaf(t, *path[j], r * 1.4, r * 0.4, a + (0.8 if i % 2 else -0.8), bend=0.5)
        daisy(t, x, y, r, rot=rng.uniform(0, 1))
    for _ in range(14):
        x, y = rng.uniform(0, T, 2)
        forget_me_not(t, x, y, rng.uniform(6, 9), rot=rng.uniform(0, 1))
    return t


def rumduol_branch():
    T = 680
    t = Tile(T)
    for (x0, y0, ang) in ((40, 120, 0.42), (380, 460, 0.42)):
        path = stem_curve(x0, y0, 420, ang, bend=0.3)
        branch(t, path[::4], 7)
        for j, s in enumerate((0.15, 0.3, 0.45, 0.6, 0.75, 0.9)):
            i = int(s * (len(path) - 1))
            a = tangent_at(path, i)
            sg = 1 if j % 2 else -1
            leaf(t, *path[i], 70, 26, a + sg * 0.9)
            if j % 2 == 0:
                rumduol(t, *(path[i] + np.array([math.cos(a - sg * 1.2), math.sin(a - sg * 1.2)]) * 34), 24, rot=UP + j)
    return t


def frangipani():
    T = 700
    t = Tile(T)
    for (cx, cy, rot) in ((200, 220, 0.0), (540, 560, 2.4)):
        for a in (rot + 0.3, rot + 1.5, rot + 2.6, rot + 3.9, rot + 5.1):
            leaf(t, cx, cy, 140, 42, a, bend=0.12)
        for (dx, dy, r, rr) in ((-34, -14, 42, 0.0), (38, 4, 40, 1.1), (-6, 50, 36, 2.3), (24, -58, 32, 0.6), (-58, 34, 28, 1.7)):
            champa(t, cx + dx, cy + dy, r, rot=rot + rr)
    for (cx, cy) in ((540, 200), (200, 540)):
        champa(t, cx, cy, 30, rot=1.0)
        for a in (0.4, 2.5, 4.4):
            leaf(t, cx, cy, 60, 20, a)
    return t


def jasmine_sprig():
    T = 600
    t = Tile(T)
    for (x0, y0, ang, b) in ((60, 80, 0.5, 0.5), (360, 360, 0.6, -0.4), (420, 60, 2.2, 0.3), (120, 400, -0.4, 0.4)):
        path = stem_curve(x0, y0, 230, ang, bend=b)
        t.line(path, 2.6, "leaf")
        for j, s in enumerate((0.2, 0.4, 0.6, 0.8)):
            i = int(s * (len(path) - 1))
            a = tangent_at(path, i)
            for sg in (1, -1):
                leaf(t, *path[i], 40, 15, a + sg * 0.9, bend=0.3)
        tip = path[-1]
        jasmine(t, *tip, 20, rot=0.3)
        jasmine(t, *(tip + np.array([-26, 18])), 15, rot=0.9)
        a = tangent_at(path, len(path) - 1)
        for da in (-0.7, 0.7):
            jasmine_bud(t, *tip, 34, a + da)
    return t


def cherry_blossom():
    T = 720
    t = Tile(T)
    for (x0, y0) in ((0, 140), (360, 500)):
        pts = [(x0, y0), (x0 + 120, y0 - 30), (x0 + 220, y0 + 30), (x0 + 330, y0 - 10), (x0 + 400, y0 + 40)]
        branch(t, pts, 8)
        branch(t, [(x0 + 220, y0 + 30), (x0 + 260, y0 + 110), (x0 + 330, y0 + 150)], 5)
        branch(t, [(x0 + 120, y0 - 30), (x0 + 150, y0 - 100)], 4)
        for (dx, dy, r) in ((110, -46, 22), (150, -104, 18), (210, 8, 24), (250, 56, 20), (270, 110, 22), (330, 150, 18),
                            (320, -30, 22), (395, 22, 20), (60, -10, 16), (180, -60, 14)):
            sakura(t, x0 + dx, y0 + dy, r, rot=dx * 0.03)
        for (dx, dy, a) in ((40, 10, UP), (360, 60, -0.3), (160, 30, 1.6)):
            bud(t, x0 + dx, y0 + dy, 18, a)
    return t


def orchid_pattern():
    T = 720
    t = Tile(T)
    for (x0, y0, ang, flip) in ((100, 560, -0.9, 1), (460, 220, -1.0, -1)):
        path = stem_curve(x0, y0, 420, ang, bend=flip * 1.1)
        t.line(path, 3, "leaf")
        for j, s in enumerate((0.3, 0.45, 0.6, 0.73, 0.85)):
            i = int(s * (len(path) - 1))
            r = 44 - j * 5
            orchid(t, *path[i], r, rot=flip * 0.2)
        a = tangent_at(path, len(path) - 1)
        bud(t, *path[-1], 16, a)
        for sg in (1, -1):
            leaf(t, x0, y0, 170, 56, -UP + sg * 1.1, bend=0.1)
    return t


def peony_pattern():
    T = 760
    t = Tile(T)
    for (cx, cy, s) in ((200, 220, 1), (570, 590, 2)):
        for a in (0.3, 1.2, 2.3, 3.4, 4.4, 5.5):
            leaf(t, cx, cy, 120, 46, a, bend=0.25)
        # buds on their stems first, so the open flower lies over the stems
        for a in (2.2, 4.0, 0.9):
            bx, by = cx + math.cos(a) * 118, cy + math.sin(a) * 118
            t.line(np.array([[cx, cy], [bx, by]]), 3, "leaf")
            bud(t, bx, by, 30, a)
        peony(t, cx, cy, 78, rot=0.2 * s, seed=s)
    for (cx, cy) in ((570, 210), (200, 580)):
        peony(t, cx, cy, 34, rot=1.0, seed=7)
        for a in (0.6, 2.6, 4.6):
            leaf(t, cx, cy, 56, 22, a)
    return t


def camellia_pattern():
    T = 680
    t = Tile(T)
    for (cx, cy, r) in ((180, 190, 46), (520, 330, 40), (260, 560, 44)):
        for a in (0.7, 2.6, 4.4):
            for sg in (0, 0.5):
                leaf(t, cx, cy, r * 2.2, r * 0.9, a + sg, bend=0.1)
        camellia(t, cx, cy, r, rot=r * 0.1)
    for (x, y) in ((560, 80), (60, 420), (600, 600)):
        bud(t, x, y, 22, UP + 0.4)
        leaf(t, x, y, 40, 16, -UP + 0.3)
    return t


def wildflowers():
    T = 520
    t = Tile(T)
    rng = np.random.default_rng(57)
    for _ in range(9):
        x, y = rng.uniform(0, T, 2)
        path = stem_curve(x, y, rng.uniform(40, 70), -UP + rng.uniform(-0.5, 0.5), bend=rng.uniform(-0.4, 0.4))
        t.line(path, 1.8, "leaf")
        leaf(t, *path[len(path) // 2], 26, 9, tangent_at(path, len(path) // 2) + 0.9, bend=0.4)
        daisy(t, x, y, rng.uniform(12, 17), rot=rng.uniform(0, 1), n=12)
    for _ in range(26):
        x, y = rng.uniform(0, T, 2)
        forget_me_not(t, x, y, rng.uniform(6, 10), rot=rng.uniform(0, 1))
    for _ in range(12):
        x, y = rng.uniform(0, T, 2)
        leaf(t, x, y, rng.uniform(18, 28), 7, rng.uniform(0, 2 * np.pi))
    return t


# ════ the newer mixed papers: kbach and flowers together ═══════════════════

def daisy_kbach():
    T = 640
    t = Tile(T)
    h = T / 2
    sides = (((0, h), (h, 0)), ((h, 0), (T, h)), ((T, h), (h, T)), ((h, T), (0, h)))
    for (x0, y0), (x1, y1) in sides:
        path = vine_path((x0, y0), (x1, y1), 12)
        vine(t, path, 4, "foil")
        for sj, sg in ((0.25, 1), (0.5, -1), (0.75, 1)):
            i = int(sj * 199)
            t.shape(SMALL, "foil", *path[i], ang=tangent_at(path, i) + sg * 0.55, k=0.75, flip=sg > 0)
    for x, y in ((h, 0), (0, h)):
        rosette(t, x, y, 20, "foil", rings=1)
    for (x, y) in ((h, h), (0, 0)):
        for a in np.linspace(0, 2 * np.pi, 7)[:-1]:
            leaf(t, x, y, 70, 22, a + 0.3, bend=0.3)
        daisy(t, x, y - 14, 34, rot=0.1)
        daisy(t, x - 40, y + 28, 24, rot=0.5)
        daisy(t, x + 42, y + 26, 22, rot=0.9)
    return t


def sakura_kbach():
    T = 720
    t = Tile(T)
    kbach_wave(t, 90, T, 14, "foil")
    kbach_wave(t, 450, T, 14, "foil", phase=np.pi / 2)
    for (x0, y0) in ((40, 260), (400, 620)):
        pts = [(x0, y0), (x0 + 110, y0 - 30), (x0 + 220, y0 + 10), (x0 + 300, y0 - 20)]
        branch(t, pts, 6)
        branch(t, [(x0 + 110, y0 - 30), (x0 + 150, y0 - 90)], 3.5)
        for (dx, dy, r) in ((100, -50, 20), (150, -94, 17), (200, 22, 22), (290, -36, 20), (60, -6, 15), (250, 30, 14)):
            sakura(t, x0 + dx, y0 + dy, r, rot=dx * 0.02)
        bud(t, x0 + 320, y0 - 10, 16, -0.2)
    return t


def orchid_kbach():
    T = 720
    t = Tile(T)
    c = T / 2
    for a in (0.0, math.pi / 2, math.pi, -math.pi / 2):
        for sg in (1, -1):
            t.shape(BIG, "foil", c + math.cos(a) * 112, c + math.sin(a) * 112, ang=a + sg * 1.25, k=0.66, flip=sg > 0)
        t.shape(CROWN, "foil", c + math.cos(a) * 168, c + math.sin(a) * 168, ang=a + math.pi, k=0.55)
    path = stem_curve(c - 40, c + 60, 150, -1.2, bend=1.0)
    t.line(path, 2.6, "leaf")
    for j, s in enumerate((0.25, 0.55, 0.85)):
        i = int(s * (len(path) - 1))
        orchid(t, *path[i], 36 - j * 6)
    leaf(t, c - 40, c + 60, 90, 30, -0.3, bend=0.1)
    leaf(t, c - 40, c + 60, 80, 28, math.pi + 0.4, bend=0.1)
    for (x, y) in ((0, 0),):
        for a in (0.5, 2.1, 3.7, 5.3):
            leaf(t, x, y, 50, 18, a)
        orchid(t, x, y, 28, rot=0.3)
    for x, y in ((c, 0), (0, c)):
        rosette(t, x, y, 18, "foil", rings=1)
    return t


def peony_kbach():
    T = 820
    t = Tile(T)
    c = T / 2
    for x0, y0 in ((0, 0), (T, 0), (0, T), (T, T)):
        v = np.array([c - x0, c - y0]) / math.hypot(c - x0, c - y0)
        path = vine_path(np.array([x0, y0]) + v * 110, np.array([c, c]) - v * 190, 16)
        vine(t, path, 7, "blind")
        for sj, sg in ((0.2, 1), (0.45, -1), (0.7, 1)):
            i = int(sj * 199)
            leaf(t, *path[i], 56, 22, tangent_at(path, i) + sg * 0.8)
    for a, k in ((UP, 1.0), (-UP, 1.0), (0.0, 0.76), (math.pi, 0.76)):
        spray(t, c, c, a, k, "foil")
    for a in (UP + math.pi / 4, UP - math.pi / 4, -UP + math.pi / 4, -UP - math.pi / 4):
        leaf(t, c + math.cos(a) * 50, c + math.sin(a) * 50, 76, 30, a)
    peony(t, c, c, 66, rot=0.3, seed=3)
    for a in (UP, -UP, 0.0, math.pi):
        spray(t, 0, 0, a, 0.5, "blind")
    peony(t, 0, 0, 38, rot=1.0, seed=5)
    for x, y in ((c, 0), (0, c)):
        for a in (0.4, 2.0, 3.6, 5.2):
            leaf(t, x, y, 40, 16, a)
        bud(t, x, y, 22, UP)
    return t


PATTERNS = {
    # Khmer artwork
    "kbach-damask": kbach_damask,
    "kbach-medallion": kbach_medallion,
    "phka-chan": phka_chan,
    "phni-waves": phni_waves,
    "kanok": kanok,
    "lintel": lintel,
    "star-net": star_net,
    "ogee-kbach": ogee_kbach,
    "hol-ikat": hol_ikat,
    "kbach-silk": kbach_silk,
    # flowers
    "rose-bouquet": rose_bouquet,
    "daisy-meadow": daisy_meadow,
    "rumduol-branch": rumduol_branch,
    "frangipani": frangipani,
    "jasmine-sprig": jasmine_sprig,
    "cherry-blossom": cherry_blossom,
    "orchid": orchid_pattern,
    "peony": peony_pattern,
    "camellia": camellia_pattern,
    "wildflowers": wildflowers,
    # kbach and flowers together
    "damask": damask,
    "silk": silk,
    "rumduol": rumduol_trellis,
    "champa": champa_pattern,
    "rose": rose_pattern,
    "jasmine": jasmine_net,
    "daisy-kbach": daisy_kbach,
    "sakura-kbach": sakura_kbach,
    "orchid-kbach": orchid_kbach,
    "peony-kbach": peony_kbach,
}


# ── emboss, colour density and output ──────────────────────────────────────

def relief(H, lines, blind):
    """The impression: soft, as a press leaves it in heavy cotton — the
    printed lines bitten in a little, the blind ornament pressed in along its
    outline, the gold a touch proud. No hard bevel: a real emboss is a gentle
    swell, catching the light only at its shoulders."""
    h = H * 0.55 - lines * 0.35 - blind * 0.6
    hmap = ndimage.gaussian_filter(h, 1.4, mode="wrap") + ndimage.gaussian_filter(h, 4.0, mode="wrap") * 0.6
    gy, gx = np.gradient(hmap)
    lx, ly, lz = -0.6, -0.6, 0.53
    nx, ny, nz = -gx * 4.0, -gy * 4.0, 1.0
    norm = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    shade = (nx * lx + ny * ly + nz * lz) / norm - lz
    return np.clip(128 + shade * 110, 0, 255)


def watercolour(a, seed):
    """A hand-tinted wash over the engraving: thin, uneven, pooling at its
    edges, not quite filling every shape, and laid a hair off the printed line
    (a colourist's wash never sits exactly in register)."""
    rng = np.random.default_rng(seed)
    n = a.shape[0]
    noise = ndimage.gaussian_filter(rng.standard_normal((n, n)), 14, mode="wrap")
    noise = noise / (noise.std() + 1e-6)
    fine = ndimage.gaussian_filter(rng.standard_normal((n, n)), 1.6, mode="wrap")
    fine = fine / (fine.std() + 1e-6)
    cover = np.clip(a * 1.2, 0, 1)
    wash = cover * np.clip(0.62 + 0.38 * noise + 0.06 * fine, 0.12, 1)
    edge = np.clip(cover - ndimage.gaussian_filter(cover, 2.6, mode="wrap"), 0, 1)
    out = wash + edge * 0.35
    out = ndimage.gaussian_filter(out, 1.3, mode="wrap")
    return np.clip(np.roll(np.roll(out, 2, 0), 1, 1), 0, 1)


def foil_grain(a, seed):
    """Foil as it transfers: a fine grain, and edges that are not quite
    perfect."""
    rng = np.random.default_rng(seed)
    n = a.shape[0]
    g = ndimage.gaussian_filter(rng.standard_normal((n, n)), 0.7, mode="wrap")
    g = g / (g.std() + 1e-6)
    return np.clip(a * (0.9 + 0.1 * g), 0, 1)


def alpha_webp(a, path):
    rgba = np.zeros(a.shape + (4,), np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = (np.clip(a, 0, 1) * 255).round().astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(path, "WEBP", quality=88, method=6)


def cotton(N=1024, seed=5):
    rng = np.random.default_rng(seed)
    v = np.zeros((N, N))
    for sigma, amp in ((60, 9), (22, 5), (7, 3)):
        n = ndimage.gaussian_filter(rng.standard_normal((N, N)), sigma, mode="wrap")
        v += n / n.std() * amp
    fib = Image.new("L", (N * 2, N * 2), 128)
    d = ImageDraw.Draw(fib)
    for _ in range(5200):
        x, y = rng.uniform(0, N, 2)
        L = rng.uniform(7, 45)
        a = rng.uniform(0, np.pi)
        bend = rng.normal(0, 0.6)
        pts = [(x + math.cos(a + bend * s) * L * s, y + math.sin(a + bend * s) * L * s) for s in np.linspace(0, 1, 8)]
        tone = int(128 + rng.choice([-1, 1]) * rng.uniform(6, 22))
        for dx in (-N, 0, N):
            for dy in (-N, 0, N):
                d.line([((px + dx) * 2, (py + dy) * 2) for px, py in pts], fill=tone, width=1)
    f = np.asarray(fib.resize((N, N), Image.LANCZOS), float) - 128
    v += ndimage.gaussian_filter(f, 0.5, mode="wrap") * 0.8
    v += ndimage.gaussian_filter(rng.standard_normal((N, N)), 0.7, mode="wrap") * 5
    return np.clip(128 + v, 0, 255)


def main():
    for i, (name, build) in enumerate(PATTERNS.items()):
        if ONLY and name not in ONLY:
            continue
        t = build()
        kline, fline, bline = t.engraving(seed=i)
        L, H = t.result()
        Image.fromarray(relief(H, kline + fline, bline).round().astype(np.uint8), "L").save(f"{OUT}/{name}-relief.webp", "WEBP", quality=88, method=6)
        alpha_webp(foil_grain(L["foil"], 50 + i), f"{OUT}/{name}-foil.webp")
        alpha_webp(foil_grain(kline, 70 + i), f"{OUT}/{name}-kline.webp")
        alpha_webp(fline, f"{OUT}/{name}-line.webp")
        for j, k in enumerate(("petal", "heart", "leaf")):
            alpha_webp(watercolour(L[k], 100 + i * 10 + j), f"{OUT}/{name}-{k}.webp")
        print("wrote", name, t.T, flush=True)
    if not ONLY or "cotton" in ONLY:
        Image.fromarray(cotton().round().astype(np.uint8), "L").save(f"{OUT}/paper-cotton-fine.webp", "WEBP", quality=88, method=6)
        print("wrote cotton")


if __name__ == "__main__":
    main()

"""
The design kits (ឈុតក្បាច់តុបតែង): eighteen coordinated sets of ornaments,
drawn as vector art.

Every kit supplies the same thirteen ornaments the invitation asks for by
role (lib/designKit.ts): the crest over the heading, the scrolls under the
section titles (four variants), the long rule, the star rule, the medallion,
the fleuron, the wing, the share scroll, the rosette, and the mark pressed
into the wax seal. All thirteen are composed from one kit's own motifs — its
centrepiece, its radial flower, its arm (the scroll or spray that runs out to
either side) and its rule ends — so every ornament on the card is from the
same hand.

The motifs reuse the drawing library of scripts/kbach-paper.py (kbach scroll
leaves with their flame hooks, flame crowns, rosettes, petals, leaves) and
add classical ones (acanthus, laurel, eucalyptus, art-deco fans, stars,
hearts and ribbons). Carved lines are real holes (an SVG mask), so the
ornament stays crisp when the invitation masks it and fills it with the
theme's gold.

Output: public/kit/sets/<kit>/<role>.svg and src/lib/design-kits.json (the
proportions of each file, read by lib/designKit.ts).

usage: python3 scripts/design-kits.py
"""
import importlib.util
import json
import math
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("kbach", os.path.join(HERE, "kbach-paper.py"))
K = importlib.util.module_from_spec(spec)
sys.argv = sys.argv[:1]
spec.loader.exec_module(K)

xf, Shape = K.xf, K.Shape
UP = -math.pi / 2
ROOT = os.path.join(HERE, "..")
OUT = os.path.join(ROOT, "public", "kit", "sets")


def simplify(p, tol=0.35):
    """Ramer–Douglas–Peucker: drop the points a curve does not need (the
    drawing library samples generously; the files should not)."""
    p = np.asarray(p, float)
    if len(p) < 4:
        return p
    keep = np.zeros(len(p), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(p) - 1)]
    while stack:
        i, j = stack.pop()
        a, b = p[i], p[j]
        seg = b - a
        L = np.hypot(*seg)
        mid = p[i + 1:j]
        if len(mid) == 0:
            continue
        if L < 1e-9:
            d = np.hypot(*(mid - a).T)
        else:
            d = np.abs(seg[0] * (mid[:, 1] - a[1]) - seg[1] * (mid[:, 0] - a[0])) / L
        k = int(np.argmax(d))
        if d[k] > tol:
            keep[i + 1 + k] = True
            stack += [(i, i + 1 + k), (i + 1 + k, j)]
    return p[keep]


class Art:
    """Fills, strokes and carved lines in one drawing, written as SVG."""

    def __init__(self):
        self.fills, self.strokes, self.cuts = [], [], []

    def poly(self, pts):
        self.fills.append(np.asarray(pts, float))

    def shape(self, s, x=0.0, y=0.0, ang=0.0, k=1.0, flip=False):
        w = Shape().add(s, x, y, ang, k, flip)
        for p in w.polys:
            self.poly(p)
        for c, wd in w.cuts:
            self.cut(c, wd)

    def stroke(self, pts, w):
        self.strokes.append((np.asarray(pts, float), w))

    def cut(self, pts, w):
        self.cuts.append((np.asarray(pts, float), w))

    def dot(self, x, y, r):
        self.poly(K.circle(r, 40) + [x, y])

    def ring(self, x, y, r, w):
        a = np.linspace(0, 2 * np.pi, 80)
        self.stroke(np.stack([x + np.cos(a) * r, y + np.sin(a) * r], 1), w)

    def mirror(self):
        """Everything drawn so far, plus its reflection about x = 0."""
        m = lambda p: p * np.array([-1, 1])
        self.fills += [m(p) for p in self.fills]
        self.strokes += [(m(p), w) for p, w in self.strokes]
        self.cuts += [(m(p), w) for p, w in self.cuts]

    def bbox(self):
        pts = [p for p in self.fills] + [p for p, _ in self.strokes]
        allp = np.concatenate(pts)
        pad = max([w for _, w in self.strokes] + [0]) / 2 + 1
        return allp.min(0) - pad, allp.max(0) + pad

    def svg(self, gold=("#7d6236", "#b8955c", "#e3c995", "#b8955c", "#7d6236")):
        (x0, y0), (x1, y1) = self.bbox()
        w, h = x1 - x0, y1 - y0
        f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")
        path = lambda p: "M" + "L".join(f"{f(a - x0)} {f(b - y0)}" for a, b in simplify(p))
        stops = "".join(f'<stop offset="{i / (len(gold) - 1):.2f}" stop-color="{c}"/>' for i, c in enumerate(gold))
        fills = "".join(f'<path d="{path(p)}Z"/>' for p in self.fills)
        strokes = "".join(
            f'<path d="{path(p)}" fill="none" stroke="url(#g)" stroke-width="{f(wd)}" stroke-linecap="round" stroke-linejoin="round"/>'
            for p, wd in self.strokes
        )
        cuts = "".join(
            f'<path d="{path(p)}" fill="none" stroke="#000" stroke-width="{f(wd)}" stroke-linecap="round" stroke-linejoin="round"/>'
            for p, wd in self.cuts
        )
        mask = f'<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="{f(w)}" height="{f(h)}"><rect width="{f(w)}" height="{f(h)}" fill="#fff"/>{cuts}</mask>' if cuts else ""
        body = f'<g fill="url(#g)"{" mask=\"url(#m)\"" if cuts else ""}>{fills}{strokes}</g>'
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" aria-hidden="true">'
            f'<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{f(w)}" y2="{f(h * 0.35)}">{stops}</linearGradient>{mask}</defs>'
            f"{body}</svg>"
        ), w, h


def curve(x0, y0, x1, y1, bow, n=60):
    t = np.linspace(0, 1, n)
    x = x0 + (x1 - x0) * t
    y = y0 + (y1 - y0) * t - bow * np.sin(np.pi * t)
    return np.stack([x, y], 1)


def taper_rule(a, length, w, y=0.0):
    """A line that swells in the middle and thins to fine points: drawn as a
    filled lens, not a stroke, so it tapers as an engraved rule does."""
    t = np.linspace(0, 1, 120)
    half = w / 2 * np.sin(np.pi * t) ** 0.6
    x = length * t
    a.poly(np.concatenate([np.stack([x, y + half], 1), np.stack([x, y - half], 1)[::-1]]))


# ── motif libraries ─────────────────────────────────────────────────────────

def leaf_poly(L, W, bend=0.25):
    poly, rib = K.leaf_shape(L, W, bend)
    return poly, rib


def put_leaf(a, x, y, L, W, ang, bend=0.25, vein=True):
    poly, rib = leaf_poly(L, W, bend)
    a.poly(xf(poly, x, y, ang))
    if vein:
        a.cut(xf(rib[6:-10], x, y, ang), max(0.6, W * 0.08))


def petal_ring(a, x, y, r, n, shape="pointed", rot=0.0, w=0.55, cut=True):
    for i in range(n):
        ang = rot + 2 * np.pi * i / n
        if shape == "pointed":
            p = K.petal(r, r * w)
        elif shape == "round":
            p = K.round_petal(r, r * w)
        else:
            p = K.round_petal(r, r * w, notch=0.12)
        a.poly(xf(p, x, y, ang))
        if cut:
            a.cut(xf(np.array([[r * 0.28, 0], [r * 0.74, 0]]), x, y, ang), max(0.6, r * 0.05))


def rosette(a, x, y, r, n=8, rings=2, shape="pointed"):
    petal_ring(a, x, y, r, n, shape)
    if rings > 1:
        a.cut(K.circle(r * 0.46, 60) + [x, y], max(0.8, r * 0.08))
        petal_ring(a, x, y, r * 0.62, n, shape, rot=np.pi / n, cut=False)
    a.dot(x, y, r * 0.2)
    a.cut(K.circle(r * 0.27, 40) + [x, y], max(0.6, r * 0.05))


def star(a, x, y, r, n=8, inner=0.38, rot=UP):
    pts = []
    for i in range(n * 2):
        rr = r if i % 2 == 0 else r * inner
        t = rot + i * np.pi / n
        pts.append((x + math.cos(t) * rr, y + math.sin(t) * rr))
    a.poly(np.array(pts))


def heart(a, x, y, s, rot=0.0):
    t = np.linspace(0, 2 * np.pi, 120)
    hx = 16 * np.sin(t) ** 3
    hy = -(13 * np.cos(t) - 5 * np.cos(2 * t) - 2 * np.cos(3 * t) - np.cos(4 * t))
    p = np.stack([hx, hy], 1) * s / 32
    c, sn = math.cos(rot), math.sin(rot)
    a.poly(p @ np.array([[c, sn], [-sn, c]]) + [x, y])


# ── the kits ────────────────────────────────────────────────────────────────
# Each kit: center(a, k) upright centrepiece at the origin, base at y = 0,
# growing up; radial(a, r) a round flower at the origin; arm(a, length, k)
# the right-hand arm from x = 0 outward along y = 0; end(a, k) a small rule
# end at the origin pointing right.

def kbach_arm(a, L, k):
    path = curve(0, 0, L, 0, L * 0.06)
    a.stroke(path, 2.4 * k)
    n = max(2, int(L / (46 * k)))
    for i in range(n):
        x = (i + 0.6) * L / (n + 0.4)
        sg = 1 if i % 2 == 0 else -1
        a.shape(K.SMALL, x, -L * 0.06 * math.sin(math.pi * x / L), ang=(-0.55 if sg > 0 else 0.55), k=0.62 * k * (1 - 0.25 * i / n), flip=sg < 0)
    a.shape(K.SMALL, L, 0, ang=-0.3, k=0.5 * k)


KITS = {}


def kit(key, label, note, frame, gold=None):
    def deco(fn):
        KITS[key] = dict(label=label, note=note, frame=frame, make=fn, gold=gold)
        return fn
    return deco


@kit("kbach-phni", "ក្បាច់ភ្ញី", "ក្បាច់ភ្ញីខ្មែរ — ស្លឹកក្បាច់អណ្ដាតភ្លើង មកុដ និងផ្កាចន្ទ", "kbach")
def _kbach_phni():
    return dict(
        center=lambda a, k: _spray(a, k),
        radial=lambda a, r: rosette(a, 0, 0, r, 8, 2),
        arm=kbach_arm,
        end=lambda a, k: a.shape(K.SMALL, 0, 0, ang=-0.3, k=0.5 * k),
    )


def _spray(a, k, crown=True):
    """The kbach spray, upright, base at the origin."""
    at = lambda d, s=0.0: (s * k, -d * k)
    a.stroke(np.array([at(10), at(140)]), 7 * k)
    for sg in (1, -1):
        a.shape(K.BIG, *at(30, sg * 4), ang=UP + sg * 1.05, k=k, flip=sg > 0)
        a.shape(K.MID, *at(100, sg * 3), ang=UP + sg * 0.7, k=k, flip=sg > 0)
    if crown:
        a.shape(K.CROWN, *at(138), ang=UP + math.pi, k=k)
    a.dot(*at(138), 6 * k)


# retired: the couple asked for no lotus anywhere (not registered as a kit)
def _kbach_lotus():
    def lotus(a, k):
        for ang, h in ((-1.15, 70), (1.15, 70), (-0.75, 84), (0.75, 84), (-0.36, 94), (0.36, 94), (0.0, 100)):
            p = K.petal(h * k, 40 * k, sharp=1.2)
            a.poly(xf(p, 0, 0, UP + ang))
            a.cut(xf(np.array([[h * 0.25 * k, 0], [h * 0.7 * k, 0]]), 0, 0, UP + ang), 1.2 * k)
        for sg in (1, -1):
            a.shape(K.MID, sg * 8 * k, 4 * k, ang=UP + sg * 1.4, k=0.8 * k, flip=sg > 0)
    return dict(center=lotus, radial=lambda a, r: rosette(a, 0, 0, r, 8, 2), arm=kbach_arm,
                end=lambda a, k: (a.poly(xf(K.petal(22 * k, 12 * k), 0, 0, 0.0))))


@kit("kbach-angkor", "ផ្តែរអង្គរ", "ក្បាច់ផ្តែរប្រាសាទ — ផ្កាចន្ទ ខ្សែកម្រងក្បាច់ និងលំពែងព្យួរ", "kbach")
def _kbach_angkor():
    def center(a, k):
        rosette(a, 0, -40 * k, 38 * k, 8, 2)
        for sg in (1, -1):
            for j in range(2):
                a.shape(K.SMALL, sg * (48 + j * 30) * k, -40 * k + (6 if j % 2 else -6) * k, ang=0.0 if sg > 0 else math.pi, k=0.6 * k, flip=j % 2 == 0)
        a.shape(K.CROWN, 0, -78 * k, ang=UP + math.pi, k=0.55 * k)

    def arm(a, L, k):
        a.stroke(np.array([[0, -6 * k], [L, -6 * k]]), 1.4 * k)
        a.stroke(np.array([[0, 6 * k], [L, 6 * k]]), 1.4 * k)
        n = max(2, int(L / (34 * k)))
        for i in range(n):
            x = (i + 0.5) * L / n
            a.shape(K.SMALL, x - 10 * k, 0, ang=0.0, k=0.42 * k, flip=i % 2 == 0)
            if i % 2 == 1:
                a.shape(K.CROWN, x, 8 * k, ang=-UP + math.pi, k=0.18 * k)
    return dict(center=center, radial=lambda a, r: rosette(a, 0, 0, r, 12, 2), arm=arm,
                end=lambda a, k: star(a, 6 * k, 0, 8 * k, 4, 0.35, 0.0))


@kit("kbach-naga", "រលកនាគ", "ក្បាច់រលកនាគ — ខ្សែកោងបន្តជាប់ ជាមួយស្លឹកក្បាច់", "kbach")
def _kbach_naga():
    def arm(a, L, k):
        t = np.linspace(0, 1, 200)
        path = np.stack([L * t, -10 * k * np.sin(2 * np.pi * 2 * t) * (1 - 0.4 * t)], 1)
        a.stroke(path, 3 * k)
        for i in range(4):
            j = int((i + 0.5) / 4 * 199)
            sg = 1 if i % 2 == 0 else -1
            a.shape(K.SMALL, *path[j], ang=-sg * 0.9, k=0.55 * k, flip=sg < 0)
        a.shape(K.MID, L, 0, ang=-0.2, k=0.45 * k)

    def center(a, k):
        a.shape(K.CROWN, 0, 0, ang=UP + math.pi, k=0.9 * k)
        for sg in (1, -1):
            a.shape(K.BIG, sg * 6 * k, -10 * k, ang=UP + sg * 1.25, k=0.75 * k, flip=sg > 0)
    return dict(center=center, radial=lambda a, r: rosette(a, 0, 0, r, 10, 1), arm=arm,
                end=lambda a, k: a.shape(K.SMALL, 0, 0, ang=-0.4, k=0.5 * k))


@kit("kbach-phka-chan", "ផ្កាចន្ទក្បាច់", "ផ្កាចន្ទបួនស្លឹក ខ្សែត្រង់ និងចំណុចគុជ", "kbach")
def _phka_chan():
    def chan(a, r):
        for i in range(4):
            ang = i * np.pi / 2
            a.poly(xf(K.petal(r, r * 0.7, sharp=1.3), 0, 0, ang))
            a.cut(xf(np.array([[r * 0.25, 0], [r * 0.75, 0]]), 0, 0, ang), max(0.6, r * 0.05))
            a.shape(K.SMALL, math.cos(ang + np.pi / 4) * r * 0.38, math.sin(ang + np.pi / 4) * r * 0.38, ang=ang + np.pi / 4, k=r / 110)
        a.dot(0, 0, r * 0.18)

    def center(a, k):
        chan(_Shift(a, 0, -46 * k), 46 * k)

    def arm(a, L, k):
        a.stroke(np.array([[0, 0], [L, 0]]), 1.3 * k)
        n = max(2, int(L / (30 * k)))
        for i in range(n):
            a.dot((i + 0.5) * L / n, 0, 2.6 * k)
        chan(_Shift(a, L, 0), 12 * k)
    return dict(center=center, radial=lambda a, r: chan(a, r), arm=arm, end=lambda a, k: chan(_Shift(a, 8 * k, 0), 8 * k))


class _Shift:
    """An Art seen through a translation (for motifs drawn at the origin)."""

    def __init__(self, a, dx, dy):
        self.a, self.d = a, np.array([dx, dy])

    def poly(self, p):
        self.a.poly(np.asarray(p) + self.d)

    def shape(self, s, x=0.0, y=0.0, **kw):
        self.a.shape(s, x + self.d[0], y + self.d[1], **kw)

    def stroke(self, p, w):
        self.a.stroke(np.asarray(p) + self.d, w)

    def cut(self, p, w):
        self.a.cut(np.asarray(p) + self.d, w)

    def dot(self, x, y, r):
        self.a.dot(x + self.d[0], y + self.d[1], r)


def floral_arm(flower, leaf_w=0.38, bud=True):
    def arm(a, L, k):
        path = curve(0, 0, L, 0, L * 0.08)
        a.stroke(path, 1.8 * k)
        n = max(2, int(L / (34 * k)))
        for i in range(n):
            j = int((i + 0.5) / n * 59)
            x, y = path[j]
            sg = 1 if i % 2 == 0 else -1
            put_leaf(a, x, y, 26 * k, 26 * k * leaf_w, -sg * 0.75 - 0.25, bend=0.3)
        flower(_Shift(a, *path[-1]), 11 * k)
    return arm


def floral_center(flower, size=40):
    def center(a, k):
        for sg in (1, -1):
            put_leaf(a, 0, -size * 0.6 * k, size * 1.05 * k, size * 0.42 * k, UP + sg * 1.05, bend=0.2)
            put_leaf(a, 0, -size * 0.6 * k, size * 0.8 * k, size * 0.34 * k, UP + sg * 0.45, bend=0.2)
        flower(_Shift(a, 0, -size * 1.05 * k), size * 0.62 * k)
    return center


def f_rose(a, r):
    for ri, (rr, n, off) in enumerate(((1.0, 6, 0.0), (0.74, 5, 0.4), (0.5, 5, 0.9))):
        for i in range(n):
            ang = off + 2 * np.pi * i / n
            a.poly(xf(K.round_petal(r * rr, r * rr * 0.95, notch=0.08), 0, 0, ang))
            a.cut(xf(K.round_petal(r * rr, r * rr * 0.95, notch=0.08)[::6], 0, 0, ang)[:20], max(0.5, r * 0.035))
    s = np.linspace(0, 4 * np.pi, 80)
    a.cut(np.stack([np.cos(s) * r * 0.24 * s / (4 * np.pi), np.sin(s) * r * 0.24 * s / (4 * np.pi)], 1), max(0.6, r * 0.05))


def f_rumduol(a, r):
    petal_ring(a, 0, 0, r, 3, "round", rot=UP, w=0.95)
    a.cut(K.circle(r * 0.48, 50), max(0.6, r * 0.06))
    petal_ring(a, 0, 0, r * 0.5, 3, "round", rot=UP + np.pi / 3, w=1.0, cut=False)


def f_champa(a, r):
    for i in range(5):
        ang = i * 2 * np.pi / 5
        a.poly(xf(K.round_petal(r, r * 0.64, skew=0.22), 0, 0, ang))
        a.cut(xf(np.array([[r * 0.15, 0], [r * 0.8, r * 0.18]]), 0, 0, ang), max(0.5, r * 0.04))
    a.dot(0, 0, r * 0.1)


def f_jasmine(a, r):
    petal_ring(a, 0, 0, r, 6, "round", w=0.42)
    a.cut(K.circle(r * 0.18, 30), max(0.5, r * 0.06))


def f_sakura(a, r):
    petal_ring(a, 0, 0, r, 5, "notch", w=0.82)
    for i in range(10):
        ang = i * 2 * np.pi / 10
        a.cut(np.array([[0, 0], [math.cos(ang) * r * 0.45, math.sin(ang) * r * 0.45]]), max(0.5, r * 0.035))


def f_peony(a, r):
    for ri, (rr, n) in enumerate(((1.0, 9), (0.78, 8), (0.56, 7), (0.34, 5))):
        for i in range(n):
            ang = ri * 0.35 + 2 * np.pi * i / n
            a.poly(xf(K.round_petal(r * rr, r * rr * 0.8, notch=0.1), 0, 0, ang))
        if ri < 3:
            a.cut(K.circle(r * rr * 0.86, 70), max(0.5, r * 0.035))


def f_daisy(a, r):
    petal_ring(a, 0, 0, r, 14, "round", w=0.26, cut=False)
    a.cut(K.circle(r * 0.34, 40), max(0.6, r * 0.06))
    a.dot(0, 0, r * 0.26)


for key, label, note, fl, frame in (
    ("rumduol", "ផ្ការំដួល", "ផ្ការំដួល ស្លឹក និងមែកឈើស្ដើង — ផ្កាជាតិកម្ពុជា", f_rumduol, "flourish"),
    ("champa", "ផ្កាចំប៉ា", "ផ្កាចំប៉ាប្រាំស្លឹក ជាមួយស្លឹកវែង", f_champa, "flourish-loop"),
    ("jasmine", "ផ្កាម្លិះ", "ផ្កាម្លិះ និងខ្សែវល្លិស្ដើងៗ", f_jasmine, "flourish"),
    ("rose", "ផ្កាកុលាប", "ផ្កាកុលាបរីក ស្លឹក និងវល្លិ — បែបបុរាណអឺរ៉ុប", f_rose, "flourish-loop"),
    ("peony", "ផ្កាប៉េអូនី", "ផ្កាប៉េអូនីស្រទាប់ៗ និងស្លឹកទន់", f_peony, "flourish-loop"),
    ("sakura", "ផ្កាសាគូរ៉ា", "ផ្កាសាគូរ៉ា ប្រាំស្លឹក និងមែកឈើ", f_sakura, "flourish"),
    ("daisy", "ផ្កាដេស៊ី", "ផ្កាដេស៊ី ស្រស់ស្រាយ និងស្លឹកស្ដើង", f_daisy, "flourish"),
):
    def _make(fl=fl):
        return dict(center=floral_center(fl), radial=lambda a, r, fl=fl: fl(a, r), arm=floral_arm(fl),
                    end=lambda a, k, fl=fl: fl(_Shift(a, 8 * k, 0), 8 * k))
    KITS[key] = dict(label=label, note=note, frame=frame, make=_make, gold=None)


@kit("laurel", "កម្រងស្លឹកឡូរ៉ែល", "កម្រងស្លឹកឡូរ៉ែលបុរាណ — សញ្ញានៃជ័យជម្នះ និងសេចក្ដីស្រឡាញ់", "flourish")
def _laurel():
    def arm(a, L, k):
        path = curve(0, 0, L, 0, L * 0.12)
        a.stroke(path, 1.6 * k)
        n = max(3, int(L / (16 * k)))
        for i in range(n):
            j = int((i + 0.5) / n * 59)
            x, y = path[j]
            tang = math.atan2(path[min(j + 1, 59)][1] - path[j - 1][1], path[min(j + 1, 59)][0] - path[j - 1][0])
            s = 1 - 0.4 * i / n
            put_leaf(a, x, y, 22 * k * s, 9 * k * s, tang - 0.75, bend=0.2, vein=False)
            put_leaf(a, x, y, 22 * k * s, 9 * k * s, tang + 0.75, bend=-0.2, vein=False)

    def wreath(a, r):
        for side in (1, -1):
            t = np.linspace(0.15, 0.95, 12)
            for tt in t:
                ang = math.pi / 2 + side * (math.pi * tt)
                x, y = math.cos(ang) * r * 0.82, math.sin(ang) * r * 0.82
                tang = ang + side * math.pi / 2
                put_leaf(a, x, y, r * 0.3, r * 0.12, tang - side * 0.6, vein=False)
        a.dot(0, r * 0.82, r * 0.07)

    def center(a, k):
        wreath(_Shift(a, 0, -42 * k), 42 * k)
        heart(a, 0, -42 * k, 22 * k)
    return dict(center=center, radial=wreath, arm=arm, end=lambda a, k: put_leaf(a, 0, 0, 16 * k, 6 * k, 0.0, vein=False))


@kit("acanthus", "ក្បាច់បារ៉ូក", "ក្បាច់ស្លឹកអាកង់ធឹសបែបបារ៉ូក — ក្បាច់វង់ធំៗ ថ្លៃថ្នូរ", "flourish")
def _acanthus():
    ACAN = K.scroll_leaf(170, 46, bend=0.3, curl=6.0, hooks=0, sway=1.6)
    ACAN_S = K.scroll_leaf(90, 26, bend=0.3, curl=5.4, hooks=0, sway=1.2)

    def arm(a, L, k):
        a.shape(ACAN, 0, 0, ang=-0.15, k=L / 190, flip=True)
        a.shape(ACAN_S, L * 0.55, -6 * k, ang=-0.6, k=L / 260)

    def center(a, k):
        for sg in (1, -1):
            a.shape(ACAN, sg * 4 * k, 0, ang=UP + sg * 1.25, k=0.55 * k, flip=sg > 0)
        a.poly(xf(K.petal(60 * k, 24 * k, sharp=1.4), 0, 0, UP))
        a.dot(0, -66 * k, 5 * k)
    return dict(center=center, radial=lambda a, r: rosette(a, 0, 0, r, 6, 2, "round"), arm=arm,
                end=lambda a, k: a.shape(ACAN_S, 0, 0, ang=-0.4, k=0.18 * k))


@kit("art-deco", "អាត ដេកូ", "ក្បាច់ធរណីមាត្របែបអាត ដេកូ — កង្ហារ កាំរស្មី និងបន្ទាត់ស្រស់", "flourish")
def _deco():
    def fan(a, r):
        for i in range(9):
            ang = math.pi + i * math.pi / 8
            a.stroke(np.array([[0, 0], [math.cos(ang) * r, math.sin(ang) * r]]), max(0.8, r * 0.035))
        for rr in (r * 0.55, r):
            t = np.linspace(math.pi, 2 * math.pi, 60)
            a.stroke(np.stack([np.cos(t) * rr, np.sin(t) * rr], 1), max(0.8, r * 0.04))
        a.dot(0, 0, r * 0.12)

    def arm(a, L, k):
        for dy, w in ((-5 * k, 1.1 * k), (0, 2.2 * k), (5 * k, 1.1 * k)):
            a.stroke(np.array([[8 * k, dy], [L - abs(dy) * 3, dy]]), w)
        a.poly(np.array([[L, 0], [L - 10 * k, -6 * k], [L - 20 * k, 0], [L - 10 * k, 6 * k]]))

    def radial(a, r):
        for i in range(16):
            ang = i * np.pi / 8
            rr = r if i % 2 == 0 else r * 0.7
            a.stroke(np.array([[math.cos(ang) * r * 0.3, math.sin(ang) * r * 0.3], [math.cos(ang) * rr, math.sin(ang) * rr]]), max(0.8, r * 0.05))
        a.ring(0, 0, r * 0.3, max(0.8, r * 0.05))
        a.dot(0, 0, r * 0.14)
    return dict(center=lambda a, k: fan(a, 60 * k), radial=radial, arm=arm,
                end=lambda a, k: a.poly(np.array([[10 * k, 0], [0, -5 * k], [-10 * k, 0], [0, 5 * k]])))


@kit("fine-line", "ខ្សែស្ដើងទំនើប", "បន្ទាត់ស្ដើង ពេជ្រតូច និងចំណុច — ស្អាតសាមញ្ញ ទំនើប", "flourish")
def _fine():
    def arm(a, L, k):
        taper_rule(a, L, 2.0 * k)
        a.dot(L * 0.5, -7 * k, 1.6 * k)
        a.dot(L * 0.5, 7 * k, 1.6 * k)

    def diamond(a, r):
        a.poly(np.array([[0, -r], [r * 0.6, 0], [0, r], [-r * 0.6, 0]]))
        a.cut(np.array([[0, -r * 0.55], [r * 0.3, 0], [0, r * 0.55], [-r * 0.3, 0], [0, -r * 0.55]]), max(0.6, r * 0.08))

    def center(a, k):
        diamond(_Shift(a, 0, -30 * k), 28 * k)
        for sg in (1, -1):
            a.dot(sg * 26 * k, -30 * k, 3 * k)
            a.dot(sg * 38 * k, -30 * k, 2 * k)

    def radial(a, r):
        diamond(a, r)
        a.ring(0, 0, r * 1.05, max(0.7, r * 0.04))
    return dict(center=center, radial=radial, arm=arm, end=lambda a, k: a.dot(4 * k, 0, 2.6 * k))


@kit("celestial", "ផ្កាយ និងព្រះចន្ទ", "ផ្កាយ ព្រះចន្ទអឌ្ឍចន្ទ និងកាំរស្មី — រាត្រីមង្គល", "flourish")
def _celestial():
    def moon(a, r):
        t = np.linspace(0, 2 * np.pi, 120)
        outer = np.stack([np.cos(t) * r, np.sin(t) * r], 1)
        inner = np.stack([np.cos(t) * r * 0.82 + r * 0.38, np.sin(t) * r * 0.82 - r * 0.1], 1)
        a.poly(outer)
        a.cut(inner, r * 0.02)
        # the inner disc is removed with a fat cut: a crescent
        a.cut(np.stack([np.cos(t) * r * 0.42 + r * 0.38, np.sin(t) * r * 0.42 - r * 0.1], 1), r * 0.82)

    def arm(a, L, k):
        a.stroke(np.array([[10 * k, 0], [L, 0]]), 1.2 * k)
        n = max(2, int(L / (40 * k)))
        for i in range(n):
            x = (i + 0.6) * L / (n + 0.2)
            star(a, x, 0, (7 - 2 * (i % 2)) * k, 4, 0.3)
        star(a, L + 6 * k, 0, 4 * k, 4, 0.3)

    def center(a, k):
        moon(_Shift(a, 0, -40 * k), 30 * k)
        star(a, 22 * k, -66 * k, 9 * k, 4, 0.3)
        star(a, -26 * k, -16 * k, 6 * k, 4, 0.3)

    def radial(a, r):
        star(a, 0, 0, r, 8, 0.42)
        a.cut(K.circle(r * 0.22, 30), max(0.6, r * 0.05))
    return dict(center=center, radial=radial, arm=arm, end=lambda a, k: star(a, 5 * k, 0, 5 * k, 4, 0.3))


@kit("eucalyptus", "ស្លឹកអ៊ឺកាលីប", "មែកស្លឹកមូលៗ បែបបូតានិក — ស្រស់ថ្លា ធម្មជាតិ", "flourish")
def _eucalyptus():
    def round_leaf(a, x, y, r, ang):
        p = K.round_petal(r * 2, r * 1.7)
        a.poly(xf(p, x, y, ang))
        a.cut(xf(np.array([[r * 0.2, 0], [r * 1.5, 0]]), x, y, ang), max(0.5, r * 0.08))

    def arm(a, L, k):
        path = curve(0, 0, L, 0, L * 0.1)
        a.stroke(path, 1.5 * k)
        n = max(3, int(L / (22 * k)))
        for i in range(n):
            j = int((i + 0.5) / n * 59)
            s = 1 - 0.45 * i / n
            sg = 1 if i % 2 == 0 else -1
            round_leaf(a, *path[j], 7 * k * s, -sg * 1.1 - 0.2)

    def center(a, k):
        a.stroke(curve(0, 0, 0.01, -90 * k, 0), 1.6 * k)
        for i, y in enumerate((-18, -34, -50, -64, -76)):
            s = 1 - i * 0.12
            for sg in (1, -1):
                round_leaf(a, 0, y * k, 9 * k * s, UP + sg * 1.0)
        round_leaf(a, 0, -86 * k, 6 * k, UP)

    def radial(a, r):
        for i in range(6):
            ang = i * np.pi / 3
            round_leaf(a, 0, 0, r * 0.5, ang)
        a.dot(0, 0, r * 0.14)
    return dict(center=center, radial=radial, arm=arm, end=lambda a, k: round_leaf(a, 0, 0, 5 * k, 0.0))


# ── composing the thirteen ornaments ───────────────────────────────────────

def compose(m):
    out = {}

    def mk():
        return Art()

    a = mk()  # crest: the centrepiece with arms either side
    m["center"](a, 1.0)
    arm = mk()
    m["arm"](arm, 150, 1.0)
    shifted = Art()
    shifted.fills = [p + [22, -28] for p in arm.fills]
    shifted.strokes = [(p + [22, -28], w) for p, w in arm.strokes]
    shifted.cuts = [(p + [22, -28], w) for p, w in arm.cuts]
    shifted.mirror()
    a.fills += shifted.fills
    a.strokes += shifted.strokes
    a.cuts += shifted.cuts
    out["crest"] = a

    def titled(center_scale, arm_len, arm_y, arm_k, extra=None):
        t = mk()
        c = mk()
        m["center"](c, center_scale)
        (cx0, cy0), (cx1, cy1) = c.bbox()
        mid = (cy0 + cy1) / 2
        t.fills += [p - [0, mid] for p in c.fills]
        t.strokes += [(p - [0, mid], w) for p, w in c.strokes]
        t.cuts += [(p - [0, mid], w) for p, w in c.cuts]
        r = mk()
        m["arm"](r, arm_len, arm_k)
        gap = cx1 + 6
        r.fills = [p + [gap, arm_y] for p in r.fills]
        r.strokes = [(p + [gap, arm_y], w) for p, w in r.strokes]
        r.cuts = [(p + [gap, arm_y], w) for p, w in r.cuts]
        r.mirror()
        t.fills += r.fills
        t.strokes += r.strokes
        t.cuts += r.cuts
        return t

    out["title"] = titled(0.42, 90, 0, 0.7)
    out["title-couple"] = titled(0.5, 80, 0, 0.65)
    out["title-program"] = titled(0.36, 110, 0, 0.75)
    out["title-venue"] = titled(0.32, 70, 0, 0.6)
    out["share"] = out["title-couple"]
    out["medallion"] = titled(0.6, 50, 0, 0.55)

    # the long rule: a tapered line each side of a small rosette, rule ends
    rl = mk()
    for side in (1, -1):
        r = mk()
        taper_rule(r, 380, 2.6)
        m["end"](_Shift(r, 386, 0), 1.0)
        r.fills = [p + [26, 0] for p in r.fills]
        r.strokes = [(p + [26, 0], w) for p, w in r.strokes]
        r.cuts = [(p + [26, 0], w) for p, w in r.cuts]
        if side < 0:
            r.fills = [p * [-1, 1] for p in r.fills]
            r.strokes = [(p * [-1, 1], w) for p, w in r.strokes]
            r.cuts = [(p * [-1, 1], w) for p, w in r.cuts]
        rl.fills += r.fills
        rl.strokes += r.strokes
        rl.cuts += r.cuts
    m["radial"](rl, 16)
    out["rule"] = rl

    st = mk()  # star rule: the radial flower large, short arms
    m["radial"](st, 34)
    r = mk()
    m["arm"](r, 120, 0.7)
    r.fills = [p + [44, 0] for p in r.fills]
    r.strokes = [(p + [44, 0], w) for p, w in r.strokes]
    r.cuts = [(p + [44, 0], w) for p, w in r.cuts]
    r.mirror()
    st.fills += r.fills
    st.strokes += r.strokes
    st.cuts += r.cuts
    out["star"] = st

    fl = mk()
    m["center"](fl, 0.8)
    out["fleuron"] = fl

    w = mk()
    m["arm"](w, 80, 0.9)
    out["wing"] = w

    ro = mk()
    m["radial"](ro, 40)
    out["rosette"] = ro

    mark = mk()
    m["radial"](mark, 40)
    mark.ring(0, 0, 46, 2.2)
    out["mark"] = mark
    return out


def main():
    manifest = {}
    for key, k in KITS.items():
        parts = compose(k["make"]())
        os.makedirs(os.path.join(OUT, key), exist_ok=True)
        manifest[key] = {"label": k["label"], "note": k["note"], "frame": k["frame"], "ornaments": {}}
        for role, art in parts.items():
            svg, w, h = art.svg()
            with open(os.path.join(OUT, key, f"{role}.svg"), "w") as fh:
                fh.write(svg)
            manifest[key]["ornaments"][role] = {"src": f"/kit/sets/{key}/{role}.svg", "w": round(w, 1), "h": round(h, 1)}
        print("kit", key, flush=True)
    with open(os.path.join(ROOT, "src", "lib", "design-kits.json"), "w") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()

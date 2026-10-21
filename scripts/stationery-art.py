"""
The stationery suites' artwork: vintage scrollwork and drawn flowers.

The ornamental language comes from the couple's own vector pack
(`vintage-flourish-ornament-frame-vector.zip`, extracted to
public/kit/flourish/): its acanthus corner, its scrolls, its rule ends and
fleurons are read here as shapes and reused — never redrawn worse. What the
pack does not have, this script draws: a few flowers, chosen and drawn with
care rather than many flowers scattered —

    camellia        the "vintage flower": rings of broad, rounded petals,
                    each with fine veins and engraved shading at its base,
                    a boss of stamens at the heart
    small blossom   five round petals and a ring of stamens, set along
                    flowering branches and vines
    buds, leaves    a camellia bud in its sepals; camellia leaves (pointed,
                    finely toothed, midrib and paired veins)
    branch, vine    a fine woody flowering branch; a climbing vine with
                    leaves, buds and tendrils, for running along the frame

No lotus anywhere — not as a flower, a bud, a petal or a shape.

The printed artwork is composed for corners (a camellia spray rising from a
lower corner with vines running up the side and along the foot; a flowering
branch hanging below an upper corner), never tiled, so the middle of the card
stays quiet. Each composition is written as plates, as it would be printed:

    petal · leaf · heart   washes (light, with more pigment towards the edge)
    line                   the engraving: outlines, veins, hatching
    foil                   a few accents struck in metal (stamens, bud tips)

Plates are single-colour SVGs used as CSS masks, so each suite sets only
colours. Mirrored corners are mirrored inside the SVG, never by a transform
on the element.

Also written, as solid foil (shapes with fine lines knocked out of them, the
way foil is stamped): the frame corners (a fine double rule with the pack's
acanthus, or with a flowering sprig), the crest, four dividers and small
marks.

usage: python3 scripts/stationery-art.py
"""
import json
import math
import os

import numpy as np
from shapely import affinity
from shapely.geometry import LineString, MultiPolygon, Point, Polygon
from shapely.ops import unary_union
from svgpathtools import svg2paths2

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "public", "art", "stationery")
PACK = os.path.join(ROOT, "public", "kit", "flourish")
os.makedirs(OUT, exist_ok=True)

RNG = np.random.default_rng(11)

# stroke weights for the printed plates (in a 1000-unit composition, which
# prints at roughly 250–450 px: about 0.6–1 px outlines, hairline hatching)
W_OUT = 2.4
W_VEIN = 1.2
W_HATCH = 0.95


# ── curves ──────────────────────────────────────────────────────────────────

def cubic(p0, p1, p2, p3, n=36):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = map(np.asarray, (p0, p1, p2, p3))
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def chain(*segs):
    pts = [cubic(*s) for s in segs]
    return np.vstack([pts[0]] + [p[1:] for p in pts[1:]])


def resample(pts, n):
    pts = np.asarray(pts, float)
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(pts, axis=0).T))]
    u = np.linspace(0, d[-1], n)
    return np.c_[np.interp(u, d, pts[:, 0]), np.interp(u, d, pts[:, 1])]


def tf(pts, s=1.0, rot=0.0, dx=0.0, dy=0.0, sx=1.0, sy=1.0):
    """Scale, rotate (degrees, clockwise on screen) and move points."""
    a = math.radians(rot)
    c, si = math.cos(a), math.sin(a)
    p = np.asarray(pts, float) * [s * sx, s * sy]
    return np.c_[p[:, 0] * c - p[:, 1] * si + dx, p[:, 0] * si + p[:, 1] * c + dy]


def gtf(g, s=1.0, rot=0.0, dx=0.0, dy=0.0, sx=1.0, sy=1.0):
    g = affinity.scale(g, s * sx, s * sy, origin=(0, 0))
    g = affinity.rotate(g, rot, origin=(0, 0))
    return affinity.translate(g, dx, dy)


def ribbon(centre, w0, w1):
    c = np.asarray(centre, float)
    d = np.gradient(c, axis=0)
    n = np.c_[-d[:, 1], d[:, 0]]
    n /= np.linalg.norm(n, axis=1)[:, None] + 1e-9
    w = np.linspace(w0, w1, len(c))[:, None] / 2
    a, b = c + n * w, c - n * w
    return Polygon(np.vstack([a, b[::-1]])).buffer(0), a, b


def biggest(g):
    if isinstance(g, MultiPolygon):
        return max(g.geoms, key=lambda x: x.area)
    return g


# ── the scene: items back to front, hidden lines removed ──────────────────

class Item:
    def __init__(self):
        self.sil = None
        self.fills = []   # (plate, polygon, gradient line or None)
        self.lines = []   # (plate, points, width)

    def fill(self, plate, poly, grad=None):
        self.fills.append((plate, poly, grad))
        return self

    def line(self, plate, pts, w):
        self.lines.append((plate, np.asarray(pts, float), w))
        return self

    def moved(self, **k):
        out = Item()
        out.sil = gtf(self.sil, **k) if self.sil is not None else None
        for plate, poly, grad in self.fills:
            g = None
            if grad is not None:
                q = tf([grad[:2], grad[2:]], **k)
                g = (*q[0], *q[1])
            out.fills.append((plate, gtf(poly, **k), g))
        for plate, pts, w in self.lines:
            out.lines.append((plate, tf(pts, **k), w))
        return out


class Scene:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.items = []

    def add(self, item):
        self.items.append(item)
        return item

    def resolve(self):
        covered = Polygon()
        fills, lines = [], []
        for it in reversed(self.items):
            for plate, poly, grad in it.fills:
                g = poly.difference(covered) if not covered.is_empty else poly
                if not g.is_empty:
                    fills.append((plate, g, grad))
            for plate, pts, w in it.lines:
                if len(pts) < 2:
                    continue
                ls = LineString(pts)
                g = ls.difference(covered) if not covered.is_empty else ls
                if not g.is_empty:
                    lines.append((plate, g, w))
            if it.sil is not None and not it.sil.is_empty:
                covered = unary_union([covered, it.sil.buffer(0.5)])
        return fills[::-1], lines[::-1]


# ── flowers ────────────────────────────────────────────────────────────────

def camellia_petal(L, wl, wr, notch=0.05):
    """A camellia petal, base at the origin, apex up: broad and obovate with
    a softly rounded, slightly waved apex — nothing pointed."""
    r = chain(((0, 0), (wr * 0.45, -L * 0.04), (wr * 1.0, -L * 0.34), (wr * 0.98, -L * 0.62)),
              ((wr * 0.98, -L * 0.62), (wr * 0.96, -L * 0.88), (wr * 0.5, -L * 1.03), (wr * 0.1, -L * (1 - notch * 0.2))),
              ((wr * 0.1, -L * (1 - notch * 0.2)), (wr * 0.05, -L * (1 - notch * 0.5)), (0, -L * (1 - notch)),
               (0, -L * (1 - notch))))
    l = chain(((0, 0), (-wl * 0.45, -L * 0.04), (-wl * 1.0, -L * 0.34), (-wl * 0.98, -L * 0.62)),
              ((-wl * 0.98, -L * 0.62), (-wl * 0.96, -L * 0.88), (-wl * 0.5, -L * 1.03), (-wl * 0.1, -L * (1 - notch * 0.2))),
              ((-wl * 0.1, -L * (1 - notch * 0.2)), (-wl * 0.05, -L * (1 - notch * 0.5)), (0, -L * (1 - notch)),
               (0, -L * (1 - notch))))
    return l, r


def petal_item(l, r, veins=6, base_hatch=0.26, rim_side=1, plate="petal"):
    """A petal: wash, outline, fine veins fanning from the base, engraved
    shading at the base (where the flower is deepest) and along one rim."""
    it = Item()
    out = np.vstack([l, r[::-1]])
    poly = Polygon(out).buffer(0)
    it.sil = poly
    tipy = min(out[:, 1])
    it.fill(plate, poly, (0, 0, 0, tipy))
    it.line("line", out, W_OUT)
    n = 60
    Lr, Rr = resample(l, n), resample(r, n)
    mid = (Lr + Rr) / 2
    for k, s in enumerate(np.linspace(-0.7, 0.7, veins)):
        side = Rr if s > 0 else Lr
        i0, i1 = int(n * 0.08), int(n * (0.62 + RNG.uniform(0, 0.12) - 0.1 * abs(s)))
        it.line("line", mid[i0:i1] + abs(s) * (side[i0:i1] - mid[i0:i1]), W_HATCH)
    for s in np.linspace(-0.9, 0.9, 15):
        side = Rr if s > 0 else Lr
        i1 = max(3, int(n * (base_hatch + RNG.uniform(-0.04, 0.04))))
        it.line("line", mid[1:i1] + abs(s) * (side[1:i1] - mid[1:i1]), W_HATCH * 0.9)
    # the rim turned towards the shade: short strokes in from the edge
    side = Rr if rim_side > 0 else Lr
    for i in range(int(n * 0.3), int(n * 0.78), 3):
        p = side[i]
        q = p + (mid[i] - p) * 0.2
        it.line("line", [p, q], W_HATCH * 0.85)
    return it


def stamens(cx, cy, r, n=22, foil=True):
    """The boss of stamens: fine filaments from the heart, each tipped with
    an anther — struck in foil."""
    it = Item()
    it.fill("heart", Point(cx, cy).buffer(r * 1.05, 32))
    for k in range(n):
        a = 2 * math.pi * k / n + RNG.uniform(-0.08, 0.08)
        rr = r * RNG.uniform(0.75, 1.05)
        p0 = (cx + math.cos(a) * r * 0.2, cy + math.sin(a) * r * 0.2)
        p1 = (cx + math.cos(a) * rr, cy + math.sin(a) * rr)
        it.line("foil" if foil else "line", [p0, p1], W_VEIN)
        it.line("foil" if foil else "line", np.array(Point(*p1).buffer(r * 0.075, 8).exterior.coords), W_VEIN)
    it.line("line", np.array(Point(cx, cy).buffer(r * 0.16, 12).exterior.coords), W_HATCH)
    return it


def camellia(scene, x, y, s, rot=0.0, tilt=1.0, rings=(7, 6, 5), turn=0.0):
    """A semi-double camellia, face on (tilt < 1 turns it towards three
    quarters): three rings of petals, each smaller and more cupped, round a
    boss of stamens."""
    specs = [(rings[0], 1.0, 0.43, 0.0), (rings[1], 0.76, 0.37, 0.5), (rings[2], 0.52, 0.31, 0.25)]
    k = dict(s=s, rot=rot, dx=x, dy=y, sy=tilt)
    for ring, (n, L, W, off) in enumerate(specs):
        for i in range(n):
            a = (i + off) * 360 / n + turn + RNG.uniform(-5, 5)
            asym = RNG.uniform(-0.06, 0.06)
            l, r = camellia_petal(L * RNG.uniform(0.95, 1.04), W * (1 + asym), W * (1 - asym),
                                  notch=RNG.uniform(0.0, 0.07))
            it = petal_item(l, r, veins=6 if ring < 2 else 4, base_hatch=0.3 if ring else 0.22,
                            rim_side=1 if i % 2 else -1)
            scene.add(it.moved(rot=a).moved(**k))
    scene.add(stamens(0, 0, 0.2).moved(**k))


def camellia_bud(scene, x, y, s, rot=0.0):
    """A camellia bud: a round bud, its petals' colour just showing, held in
    overlapping sepals."""
    it = Item()
    body = affinity.scale(Point(0, -0.55).buffer(0.5, 48), 0.72, 1.0)
    it.sil = body
    it.fill("petal", body, (0, 0, 0, -1.05))
    it.line("line", np.array(body.exterior.coords), W_OUT)
    for t in (-0.18, 0.12):
        it.line("line", cubic((t, -1.0), (t + 0.18, -0.8), (t + 0.12, -0.45), (t - 0.05, -0.2), 20), W_VEIN)
    scene.add(it.moved(s=s, rot=rot, dx=x, dy=y))
    for a, sx in ((-34, 1), (34, 1), (0, 1.1)):
        sep = Item()
        p = affinity.scale(Point(0, -0.2).buffer(0.22, 24), 1.0 * sx, 1.15)
        p = affinity.rotate(p, a, origin=(0, 0))
        sep.sil = p
        sep.fill("leaf", p)
        sep.line("line", np.array(p.exterior.coords), W_OUT)
        sep.line("line", tf(cubic((0, -0.02), (0, -0.15), (0, -0.25), (0, -0.33), 8), 1, a), W_HATCH)
        scene.add(sep.moved(s=s, rot=rot, dx=x, dy=y))
    # the light on the tip
    scene.add(Item().line("foil", tf(cubic((-0.12, -1.0), (-0.05, -1.06), (0.06, -1.06), (0.13, -1.0), 10), s, rot, x, y),
                          W_VEIN * 1.3))


def blossom(scene, x, y, s, rot=0.0, tilt=1.0):
    """A small five-petalled blossom (the flowering branch's), round petals
    just overlapping, a ring of stamens."""
    k = dict(s=s, rot=rot, dx=x, dy=y, sy=tilt)
    for i in range(5):
        a = i * 72 + RNG.uniform(-4, 4)
        l, r = camellia_petal(1.0, 0.5, 0.5, notch=0.1)
        it = petal_item(l, r, veins=3, base_hatch=0.25)
        scene.add(it.moved(rot=a).moved(**k))
    scene.add(stamens(0, 0, 0.36, n=11).moved(**k))


def blossom_bud(scene, x, y, s, rot=0.0):
    it = Item()
    p = affinity.scale(Point(0, -0.5).buffer(0.5, 24), 0.8, 1.0)
    it.sil = p
    it.fill("petal", p, (0, 0, 0, -1))
    it.line("line", np.array(p.exterior.coords), W_OUT * 0.9)
    it.line("line", cubic((-0.1, -0.95), (0.1, -0.7), (0.05, -0.4), (-0.1, -0.15), 12), W_HATCH)
    scene.add(it.moved(s=s, rot=rot, dx=x, dy=y))
    c = Item()
    cal = Polygon([(-0.32, -0.12), (0, 0.12), (0.32, -0.12), (0, -0.02)]).buffer(0.04)
    c.sil = cal
    c.fill("leaf", cal)
    c.line("line", np.array(cal.exterior.coords), W_OUT * 0.8)
    scene.add(c.moved(s=s, rot=rot, dx=x, dy=y))


def leaf(scene, x, y, L, W, rot, fold=0.22, veins=7, curl=0.0, teeth=14):
    """A camellia leaf, base at (x, y): elliptic with a drawn-out point, a
    finely toothed margin, the midrib and paired veins arching forward."""
    tip = (curl * L, -L)
    R = chain(((0, 0), (W * 0.55, -L * 0.06), (W * 1.04, -L * 0.36), (W * 0.94, -L * 0.6)),
              ((W * 0.94, -L * 0.6), (W * 0.82, -L * 0.82), (W * 0.22 + tip[0] * 0.7, -L * 0.94), tip))
    Wl = W * (1 - fold)
    Lf = chain(((0, 0), (-Wl * 0.55, -L * 0.06), (-Wl * 1.04, -L * 0.36), (-Wl * 0.94, -L * 0.6)),
               ((-Wl * 0.94, -L * 0.6), (-Wl * 0.82, -L * 0.82), (-Wl * 0.22 + tip[0] * 0.7, -L * 0.94), tip))

    def toothed(edge, sgn):
        e = resample(edge, 120)
        d = np.gradient(e, axis=0)
        n = np.c_[-d[:, 1], d[:, 0]] * sgn
        n /= np.linalg.norm(n, axis=1)[:, None] + 1e-9
        u = np.linspace(0, 1, len(e))
        saw = ((u * teeth) % 1) ** 2.5
        amp = L * 0.007 * np.clip(np.sin(np.pi * np.clip((u - 0.15) / 0.8, 0, 1)), 0, 1)
        return e + n * (saw * amp)[:, None]

    R2, L2 = toothed(R, -1), toothed(Lf, 1)
    out = np.vstack([L2, R2[::-1]])
    it = Item()
    poly = Polygon(out).buffer(0)
    it.sil = poly
    it.fill("leaf", poly, (0, 0, tip[0], tip[1]))
    it.line("line", out, W_OUT)
    mid = chain(((0, 0), (W * fold * 0.18, -L * 0.3), (curl * L * 0.5 + W * fold * 0.12, -L * 0.7), tip))
    it.line("line", mid[:-4], W_VEIN * 1.2)
    n = 50
    Lr, Rr, M = resample(Lf, n), resample(R, n), resample(mid, n)
    for k in range(veins):
        u = 0.12 + 0.72 * k / (veins - 1)
        i = int(u * n)
        j = min(n - 1, i + 6)
        for side in (Rr, Lr):
            p0 = M[i]
            p3 = M[j] + 0.86 * (side[j] - M[j])
            p1 = p0 + 0.5 * (side[i] - M[i])
            it.line("line", cubic(p0, p1, (p1 + p3) / 2, p3, 12), W_HATCH)
    for k in range(12):
        i = int((0.08 + 0.8 * k / 11) * n)
        it.line("line", [M[i] + 0.12 * (Lr[i] - M[i]), M[i] + 0.62 * (Lr[i] - M[i])], W_HATCH * 0.85)
    scene.add(it.moved(rot=rot, dx=x, dy=y))


def stem(scene, pts, w0, w1, bark=False, plate="leaf"):
    pts = np.asarray(pts, float)
    c = resample(cubic(*pts, 120) if len(pts) == 4 else pts, 90)
    poly, a, b = ribbon(c, w0, w1)
    it = Item()
    it.sil = poly
    it.fill(plate, poly)
    it.line("line", a, W_OUT * 0.85)
    it.line("line", b, W_OUT * 0.85)
    if bark:
        for i in range(4, 86, 5):
            p, q = a[i], b[i]
            it.line("line", [p, p + (q - p) * 0.35], W_HATCH * 0.8)
    scene.add(it)
    return c


def tendril(scene, p, ang, r, turns=1.6, sgn=1):
    """A vine's tendril: a fine line winding into a tightening spiral."""
    pts = [np.array(p, float)]
    a = math.radians(ang)
    n = int(60 * turns)
    for k in range(1, n):
        a += sgn * (0.06 + 0.16 * k / n)
        step = r * 0.05 * (1 - 0.7 * k / n)
        pts.append(pts[-1] + step * np.array([math.cos(a), math.sin(a)]))
    scene.add(Item().line("line", np.array(pts), W_VEIN))


def vine(scene, pts, w=4.0, leaves=(), blossoms=(), buds=(), end_tendril=True, sgn=1):
    """A climbing vine along a curve: leaves, blossoms and buds at fractions
    of its length (each with a side and a size), and a tendril at its end."""
    c = stem(scene, pts, w, w * 0.45)
    n = len(c)

    def at(u):
        i = min(n - 2, int(u * (n - 1)))
        d = c[i + 1] - c[i]
        return c[i], math.degrees(math.atan2(d[1], d[0]))

    for u, side, L in leaves:
        p, th = at(u)
        leaf(scene, p[0], p[1], L, L * 0.34, th + 90 + side * 52, curl=0.08 * side, veins=5, teeth=10)
    for u, side, size in buds:
        p, th = at(u)
        blossom_bud(scene, p[0], p[1], size, th + 90 + side * 40)
    for u, side, size in blossoms:
        p, th = at(u)
        q = (p[0] + math.cos(math.radians(th + side * 90)) * size * 0.9,
             p[1] + math.sin(math.radians(th + side * 90)) * size * 0.9)
        stem(scene, [p, q], 2.6, 2.0)
        blossom(scene, q[0], q[1], size, rot=RNG.uniform(0, 72))
    if end_tendril:
        p, th = at(0.995)
        tendril(scene, p, th, 55, sgn=sgn, turns=1.3)
    return c


# ── compositions ───────────────────────────────────────────────────────────

def comp_camellia_spray():
    """Rising from the lower left, set just inside the corner ornament (which
    keeps the corner itself): two camellias and a bud in a nest of leaves, a
    vine climbing the side above the corner and another running along the
    foot, flowering as they go."""
    sc = Scene(1000, 1000)
    # vines first: they pass behind the main group
    vine(sc, [(250, 760), (90, 690), (60, 520), (70, 300)], w=4.0,
         leaves=[(0.14, 1, 62), (0.3, -1, 58), (0.47, 1, 52), (0.64, -1, 46), (0.8, 1, 38)],
         blossoms=[(0.38, -1, 28), (0.72, 1, 22)], buds=[(0.9, -1, 20), (0.56, 1, 18)], sgn=1)
    vine(sc, [(520, 900), (640, 975), (760, 930), (930, 960)], w=3.8,
         leaves=[(0.14, -1, 58), (0.32, 1, 52), (0.52, -1, 46), (0.72, 1, 40)],
         blossoms=[(0.42, 1, 26), (0.84, -1, 20)], buds=[(0.94, 1, 18)], sgn=-1)
    # the leaves behind the flowers
    for (lx, ly, L, r, f, cu) in [(380, 820, 180, -50, 0.25, 0.08), (410, 820, 175, 15, 0.2, -0.06),
                                  (460, 840, 165, 70, 0.25, -0.08), (370, 850, 150, -100, 0.3, 0.1),
                                  (500, 860, 150, 120, 0.25, -0.06), (330, 800, 120, -20, 0.3, 0.1)]:
        leaf(sc, lx, ly, L, L * 0.36, r, fold=f, curl=cu)
    stem(sc, [(260, 960), (300, 900), (350, 850), (410, 790)], 8, 5.5, bark=True)
    stem(sc, [(350, 850), (420, 760), (470, 700), (500, 660)], 5, 4)
    camellia_bud(sc, 502, 662, 56, rot=26)
    camellia(sc, 575, 820, 90, rot=18, tilt=0.72, turn=10)
    camellia(sc, 410, 770, 120, rot=-8)
    return sc


def comp_branch_hang():
    """A fine flowering branch hanging from below the upper right corner:
    small blossoms and buds along woody twigs, a few leaves, one camellia
    half open where the branch divides."""
    sc = Scene(1000, 1000)
    main = stem(sc, [(1020, 140), (880, 150), (760, 230), (560, 330)], 8, 4, bark=True)
    tw1 = stem(sc, [(820, 180), (780, 260), (760, 320), (730, 390)], 4.5, 3, bark=True)
    tw2 = stem(sc, [(660, 280), (620, 230), (560, 220), (500, 230)], 4, 2.6, bark=True)
    for (lx, ly, L, r, cu) in [(900, 150, 110, -150, -0.06), (700, 255, 96, 160, 0.06), (760, 300, 84, -120, 0.08),
                               (590, 315, 80, -150, -0.06), (560, 222, 70, -60, 0.06)]:
        leaf(sc, lx, ly, L, L * 0.34, r, curl=cu, veins=5, teeth=10)
    for (bx, by, s_) in [(612, 312, 30), (560, 336, 26), (742, 372, 28), (728, 404, 22), (528, 222, 24), (600, 224, 22),
                         (860, 172, 24)]:
        blossom(sc, bx, by, s_, rot=RNG.uniform(0, 72))
    for (bx, by, s_, r) in [(500, 232, 20, -100), (734, 398, 0, 0), (548, 342, 18, -130), (796, 248, 18, 150)]:
        if s_:
            blossom_bud(sc, bx, by, s_, r)
    camellia(sc, 800, 205, 62, rot=10, tilt=0.8, rings=(6, 5, 4))
    tendril(sc, main[-1], 170, 50, sgn=-1, turns=1.3)
    return sc


def comp_camellia_single():
    """One camellia with its leaves and a bud — the answer in an opposite
    corner, or a blind impression."""
    sc = Scene(600, 600)
    for (lx, ly, L, r, cu) in [(190, 450, 170, -30, 0.08), (210, 450, 150, 40, -0.08), (200, 470, 130, 100, -0.08)]:
        leaf(sc, lx, ly, L, L * 0.36, r, curl=cu)
    stem(sc, [(150, 610), (170, 540), (190, 500), (205, 460)], 7, 5, bark=True)
    stem(sc, [(205, 470), (250, 420), (290, 390), (320, 370)], 4, 3)
    camellia_bud(sc, 322, 372, 44, rot=50)
    camellia(sc, 200, 420, 96, rot=-12)
    return sc


# ── the pack, read as shapes ───────────────────────────────────────────────

def pack(name, drop=None):
    """One of the pack's SVGs as a shapely geometry (even-odd within each
    path, as drawn). `drop(bbox)` leaves out subpaths — e.g. a corner's long
    arms, where the double rule takes over."""
    paths, _, svga = svg2paths2(os.path.join(PACK, f"{name}.svg"))
    vb = [float(v) for v in svga["viewBox"].split()]
    out = []
    for p in paths:
        g = None
        for sp in p.continuous_subpaths():
            x0, x1, y0, y1 = sp.bbox()
            if drop and drop((x0, y0, x1 - x0, y1 - y0)):
                continue
            pts = []
            for seg in sp:
                n = max(4, int(seg.length() / 1.2))
                for t in np.linspace(0, 1, n, endpoint=False):
                    z = seg.point(t)
                    pts.append((z.real, z.imag))
            if len(pts) < 3:
                continue
            q = Polygon(pts).buffer(0)
            g = q if g is None else g.symmetric_difference(q)
        if g is not None:
            out.append(g)
    return unary_union(out), (vb[2], vb[3])


def long_thin(bb, limit=120):
    return max(bb[2], bb[3]) > limit


# ── foil shapes of the drawn flowers ───────────────────────────────────────

def foil_camellia(x, y, s, gap=1.6, rings=((7, 1.0, 0.43, 0), (6, 0.74, 0.37, 0.5)), heart=True):
    """A camellia as a foil mark: petals separated by fine knock-out lines,
    a ring of seed-like anthers at the heart."""
    shapes = []
    for n, L, W, off in rings:
        for i in range(n):
            a = (i + off) * 360 / n
            l, r = camellia_petal(L, W, W, notch=0.06)
            shapes.append(affinity.rotate(Polygon(np.vstack([l, r[::-1]])).buffer(0), a, origin=(0, 0)))
    out = []
    g = gap / s
    for i, p in enumerate(shapes):
        for q in shapes[i + 1:]:
            p = p.difference(q.buffer(g))
        out.append(p)
    body = unary_union(out)
    if heart:
        body = body.difference(Point(0, 0).buffer(0.3, 32))
        ring = []
        for k in range(10):
            a = 2 * math.pi * k / 10
            ring.append(Point(math.cos(a) * 0.17, math.sin(a) * 0.17).buffer(0.045, 10))
        body = unary_union([body, *ring, Point(0, 0).buffer(0.07, 12)])
    return gtf(body, s=s, dx=x, dy=y)


def foil_blossom(x, y, s, gap=1.4):
    """A small five-petalled blossom in foil: round petals parted by fine
    gaps, an open heart with a dot of stamens."""
    shapes = []
    for i in range(5):
        l, r = camellia_petal(1.0, 0.4, 0.4, notch=0.12)
        shapes.append(affinity.rotate(Polygon(np.vstack([l, r[::-1]])).buffer(0), i * 72, origin=(0, 0)))
    out = []
    for i, p in enumerate(shapes):
        nb = [shapes[(i + 1) % 5], shapes[(i - 1) % 5]]
        out.append(p.difference(unary_union(nb).buffer(gap / s / 2)))
    body = unary_union(out).difference(Point(0, 0).buffer(0.26, 24))
    body = unary_union([body, Point(0, 0).buffer(0.11, 12)])
    return gtf(body, s=s, dx=x, dy=y)


def foil_leaf(x, y, L, W, rot, curl=0.0, cut=1.3):
    tip = (curl * L, -L)
    R = chain(((0, 0), (W * 0.55, -L * 0.06), (W * 1.04, -L * 0.36), (W * 0.94, -L * 0.6)),
              ((W * 0.94, -L * 0.6), (W * 0.82, -L * 0.82), (W * 0.22 + tip[0] * 0.7, -L * 0.94), tip))
    Lf = chain(((0, 0), (-W * 0.55, -L * 0.06), (-W * 1.04, -L * 0.36), (-W * 0.94, -L * 0.6)),
               ((-W * 0.94, -L * 0.6), (-W * 0.82, -L * 0.82), (-W * 0.22 + tip[0] * 0.7, -L * 0.94), tip))
    p = Polygon(np.vstack([Lf, R[::-1]])).buffer(0)
    mid = chain(((0, -L * 0.08), (curl * L * 0.1, -L * 0.4), (curl * L * 0.4, -L * 0.7), (tip[0] * 0.85, -L * 0.84)))
    p = p.difference(LineString(mid).buffer(cut / 2))
    return gtf(p, rot=rot, dx=x, dy=y)


def foil_bud(x, y, L, rot):
    body = affinity.scale(Point(0, -0.55).buffer(0.5, 32), 0.72, 1.0)
    body = body.difference(LineString(cubic((-0.18, -1.0), (0.0, -0.8), (-0.05, -0.45), (-0.2, -0.2), 16)).buffer(0.035))
    cal = Polygon([(-0.4, -0.25), (-0.2, 0.05), (0.2, 0.05), (0.4, -0.25), (0, -0.12)]).buffer(0.03)
    g = unary_union([body.difference(cal.buffer(0.04)), cal])
    return gtf(g, s=L, rot=rot, dx=x, dy=y)


def fine_stem(pts, w0, w1):
    c = resample(cubic(*np.asarray(pts, float), 80), 80)
    return ribbon(c, w0, w1)[0]


def dot(x, y, r):
    return Point(x, y).buffer(r, 16)


def curl_line(p, ang, r, sgn=1, w=1.6, turns=1.4):
    pts = [np.array(p, float)]
    a = math.radians(ang)
    n = int(50 * turns)
    for k in range(1, n):
        a += sgn * (0.07 + 0.18 * k / n)
        pts.append(pts[-1] + r * 0.05 * (1 - 0.7 * k / n) * np.array([math.cos(a), math.sin(a)]))
    return ribbon(np.array(pts), w, w * 0.35)[0]


def sprig(p0, p1, side, w=2.2, leaves=3, blossoms=1, L=22.0, bend=0.25):
    """A fine flowering sprig from p0 to p1: leaves alternating along it, a
    small blossom near its end, a curl to finish."""
    p0, p1 = np.array(p0, float), np.array(p1, float)
    d = p1 - p0
    nrm = np.array([-d[1], d[0]]) * bend * side
    pts = cubic(p0, p0 + d * 0.33 + nrm, p0 + d * 0.66 + nrm, p1, 60)
    parts = [ribbon(pts, w, w * 0.45)[0]]
    n = len(pts)
    for k in range(leaves):
        i = int(n * (0.2 + 0.6 * k / max(1, leaves - 1)))
        dd = pts[min(n - 1, i + 2)] - pts[max(0, i - 2)]
        th = math.degrees(math.atan2(dd[1], dd[0]))
        off = 46 if k % 2 == 0 else -46
        Lk = L * (1 - 0.25 * k / max(1, leaves - 1))
        parts.append(foil_leaf(pts[i][0], pts[i][1], Lk, Lk * 0.32, th + 90 + off, curl=-0.1 * np.sign(off)))
    th_end = math.degrees(math.atan2(*(pts[-1] - pts[-3])[::-1]))
    if blossoms:
        parts.append(foil_blossom(pts[-1][0], pts[-1][1], L * 0.42))
    else:
        parts.append(curl_line(pts[-1], th_end, L * 2.2, sgn=side, w=w * 0.8))
    return unary_union(parts)


# ── output ─────────────────────────────────────────────────────────────────

def path_d(pts, close=False, tol=0.3):
    c = np.asarray(LineString(np.asarray(pts)).simplify(tol).coords)
    return ("M" + f"{c[0][0]:.1f} {c[0][1]:.1f}" + "L" + " ".join(f"{p[0]:.1f} {p[1]:.1f}" for p in c[1:])
            + ("Z" if close else ""))


def poly_d(g, tol=0.3):
    out = []
    for p in getattr(g, "geoms", [g]):
        if not isinstance(p, Polygon) or p.is_empty or p.area < 0.3:
            continue
        out.append(path_d(np.array(p.exterior.coords), True, tol))
        for r in p.interiors:
            out.append(path_d(np.array(r.coords), True, tol))
    return "".join(out)


def lines_of(g):
    if isinstance(g, LineString):
        return [np.array(g.coords)]
    out = []
    for x in getattr(g, "geoms", []):
        out += lines_of(x)
    return out


PLATES = ("petal", "leaf", "heart", "line", "foil")
MIRROR = {"tl": (0, 0), "tr": (1, 0), "bl": (0, 1), "br": (1, 1)}


def mirror_attr(W, H, mx, my):
    t = []
    if mx:
        t.append(f"translate({W:g} 0) scale(-1 1)")
    if my:
        t.append(f"translate(0 {H:g}) scale(1 -1)")
    return f' transform="{" ".join(t)}"' if t else ""


def write_scene(scene, name, corners):
    """Each plate, once per corner it serves. A mirrored corner is the same
    drawing in a mirroring group."""
    fills, lines = scene.resolve()
    W, H = scene.w, scene.h
    body = {p: [] for p in PLATES}
    defs = {p: [] for p in PLATES}
    for i, (plate, g, grad) in enumerate(fills):
        d = poly_d(g)
        if not d:
            continue
        if grad and plate in ("petal", "leaf"):
            gid = f"g{i}"
            lo, hi = (0.3, 0.95) if plate == "petal" else (0.55, 0.9)
            defs[plate].append(
                f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{grad[0]:.1f}" y1="{grad[1]:.1f}" '
                f'x2="{grad[2]:.1f}" y2="{grad[3]:.1f}"><stop offset="0" stop-opacity="{lo}"/>'
                f'<stop offset="1" stop-opacity="{hi}"/></linearGradient>')
            body[plate].append(f'<path fill="url(#{gid})" d="{d}"/>')
        else:
            body[plate].append(f'<path d="{d}"/>')
    byw = {}
    for plate, g, w in lines:
        for pts in lines_of(g):
            if len(pts) >= 2 and LineString(pts).length >= 1.2:
                byw.setdefault((plate, round(w, 2)), []).append(path_d(pts))
    for (plate, w), ds in byw.items():
        body[plate].append(f'<path fill="none" stroke="#000" stroke-width="{w}" stroke-linecap="round" '
                           f'stroke-linejoin="round" d="{"".join(ds)}"/>')
    files = {}
    for corner, (mx, my) in corners.items():
        tr = mirror_attr(W, H, mx, my)
        for plate in PLATES:
            if not body[plate]:
                continue
            svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">'
                   + (f"<defs>{''.join(defs[plate])}</defs>" if defs[plate] else "")
                   + f"<g{tr}>{''.join(body[plate])}</g></svg>")
            with open(os.path.join(OUT, f"{name}-{corner}-{plate}.svg"), "w") as fh:
                fh.write(svg)
            files.setdefault(corner, []).append(plate)
    return files


def write_solid(g, name, W, H, corners=None):
    d = poly_d(g, tol=0.2)
    for corner, (mx, my) in (corners or {"": (0, 0)}).items():
        fn = f"{name}-{corner}.svg" if corner else f"{name}.svg"
        with open(os.path.join(OUT, fn), "w") as fh:
            fh.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:g} {H:g}">'
                     f'<path{mirror_attr(W, H, mx, my)} d="{d}"/></svg>')


# ── frame corners ──────────────────────────────────────────────────────────

CORNER = {"W": 400, "o": 22, "i": 36, "wo": 3.0, "wi": 1.8}


def double_rule_corner(notch=(28, 18)):
    """The fine double rule turning the corner in a quarter-round notch; its
    runs go to the edges of the drawing to meet the rule along each side."""
    W, o, i, wo, wi = CORNER["W"], CORNER["o"], CORNER["i"], CORNER["wo"], CORNER["wi"]
    parts = []
    for r, t, n in ((o, wo, notch[0]), (i, wi, notch[1])):
        parts.append(Polygon([(r + n, r - t / 2), (W, r - t / 2), (W, r + t / 2), (r + n, r + t / 2)]))
        parts.append(Polygon([(r - t / 2, r + n), (r - t / 2, W), (r + t / 2, W), (r + t / 2, r + n)]))
        arc = [(r + n * math.sin(a), r + n * math.cos(a)) for a in np.linspace(0, math.pi / 2, 30)]
        parts.append(LineString(arc).buffer(t / 2))
    parts.append(dot(o * 0.55, o * 0.55, 2.6))
    return unary_union(parts)


def corner_acanthus():
    """The pack's acanthus corner, its long swash arms left out (the double
    rule takes over from them), set inside the rules' corner, with a
    flowering sprig running a little way along each rule."""
    W, i = CORNER["W"], CORNER["i"]
    acan, (pw, ph) = pack("corner", drop=lambda bb: long_thin(bb) or (bb[0] > 290 and bb[1] < 60) or
                                                   (bb[1] > 330 and bb[0] < 60))
    bx0, by0, bx1, by1 = acan.bounds
    s = 230 / max(bx1 - bx0, by1 - by0)
    acan = gtf(affinity.translate(acan, -bx0, -by0), s=s, dx=i + 8, dy=i + 8)
    parts = [double_rule_corner(), acan]
    x1 = i + 6 + acan.bounds[2] - (i + 6)
    y1 = acan.bounds[3]
    parts.append(sprig((x1 - 6, i + 14), (x1 + 120, i + 12), side=1, leaves=3, L=24, bend=0.06))
    parts.append(sprig((i + 14, y1 - 6), (i + 12, y1 + 110), side=-1, leaves=3, L=24, bend=0.06))
    return unary_union(parts)


def corner_floral():
    """A lighter corner for the branch suite: the rules, and on the diagonal
    a small camellia with two sprigs laid along the rules."""
    i = CORNER["i"]
    c = i + 46
    parts = [double_rule_corner(), foil_camellia(c, c, 34)]
    parts.append(sprig((c + 26, c - 16), (c + 190, i + 12), side=-1, leaves=4, L=26, bend=0.08))
    parts.append(sprig((c - 16, c + 26), (i + 12, c + 190), side=1, leaves=4, L=26, bend=0.08))
    parts.append(foil_leaf(c + 6, c + 6, 40, 12, 135, curl=0.08))
    return unary_union(parts)


def corner_loop():
    """The richer corner for the vintage suite: the pack's looped corner,
    arms left out, larger, over the double rule."""
    i = CORNER["i"]
    loop, (pw, ph) = pack("corner-loop", drop=lambda bb: (min(bb[2], bb[3]) < 5 and max(bb[2], bb[3]) > 100)
                          or bb[0] > 380 or bb[1] > 360)
    s = 250 / max(loop.bounds[2] - loop.bounds[0], loop.bounds[3] - loop.bounds[1])
    loop = gtf(affinity.translate(loop, -loop.bounds[0], -loop.bounds[1]), s=s, dx=i + 4, dy=i + 4)
    x1, y1 = loop.bounds[2], loop.bounds[3]
    parts = [double_rule_corner(), loop]
    parts.append(sprig((x1 - 4, i + 13), (x1 + 90, i + 11), side=1, leaves=2, L=22, bend=0.05))
    parts.append(sprig((i + 13, y1 - 4), (i + 11, y1 + 80), side=-1, leaves=2, L=22, bend=0.05))
    return unary_union(parts)


# ── crest, dividers, marks ─────────────────────────────────────────────────

def ornaments():
    files = {}
    # crest: a camellia over the pack's symmetrical scroll, flowering sprigs
    # sweeping out to either side
    W, H = 640, 220
    bow, (bw, bh) = pack("scroll-bow")
    sb = 300 / bw
    bow = gtf(bow, s=sb, dx=320 - 150, dy=128)
    parts = [bow, foil_camellia(320, 112, 46)]
    for side in (1, -1):
        parts.append(sprig((320 + side * 52, 122), (320 + side * 255, 112), side=-side, leaves=4, L=26, bend=0.12))
        parts.append(dot(320 + side * 286, 112, 3.0))
    write_solid(unary_union(parts), "crest", W, H)
    files["crest"] = (W, H)

    # 1. double line with an ornamental endpoint (the pack's rule end)
    W, H = 700, 70
    cy = 35
    end, (ew, eh) = pack("rule-end")
    se = 46 / eh
    e1 = gtf(end, s=se, dx=0, dy=cy - 23)
    e2 = gtf(end, s=se, sx=-1, dx=W, dy=cy - 23)
    ew2 = ew * se
    parts = [e1, e2]
    for y0, t in ((cy - 4, 1.4), (cy + 4, 0.8)):
        parts.append(Polygon([(ew2 - 4, y0 - t / 2), (W / 2 - 22, y0 - t / 2), (W / 2 - 22, y0 + t / 2), (ew2 - 4, y0 + t / 2)]))
        parts.append(Polygon([(W / 2 + 22, y0 - t / 2), (W - ew2 + 4, y0 - t / 2), (W - ew2 + 4, y0 + t / 2), (W / 2 + 22, y0 + t / 2)]))
    parts.append(foil_blossom(W / 2, cy, 13))
    write_solid(unary_union(parts), "divider-double", W, H)
    files["divider-double"] = (W, H)

    # 2. a flowering branch: a blossom at the centre, sprigs out either side
    W, H = 460, 80
    cx, cy = 230, 44
    parts = [foil_blossom(cx, cy, 16)]
    for side in (1, -1):
        parts.append(sprig((cx + side * 18, cy + 2), (cx + side * 205, cy - 6), side=side, leaves=5, L=24, bend=0.1,
                           blossoms=0))
        parts.append(foil_bud(cx + side * 120, cy - 4, 16, side * 70))
    write_solid(unary_union(parts), "divider-branch", W, H)
    files["divider-branch"] = (W, H)

    # 3. symmetrical vintage scroll: the pack's own, as drawn
    files["divider-scroll"] = ("pack", "scroll-diamond")

    # 4. the grand divider for major sections: the pack's long rule with its
    # centre ornament, and a camellia sprig set either side of the centre
    rule, (rw, rh) = pack("rule")
    W, H = rw, rh + 40
    parts = [affinity.translate(rule, 0, 40)]
    cx = rw / 2
    for side in (1, -1):
        parts.append(sprig((cx + side * 130, 40 + rh * 0.45), (cx + side * 280, 32 + rh * 0.38), side=-side, leaves=4,
                           L=20, bend=0.12))
    write_solid(unary_union(parts), "divider-grand", W, H)
    files["divider-grand"] = (W, H)

    # marks
    write_solid(foil_camellia(60, 60, 54), "mark-camellia", 120, 120)
    files["mark-camellia"] = (120, 120)
    write_solid(foil_blossom(40, 40, 36), "mark-blossom", 80, 80)
    files["mark-blossom"] = (80, 80)
    return files


def main():
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))
    comps = {
        "camellia-spray": (comp_camellia_spray(), {"bl": (0, 0), "br": (1, 0)}),
        "branch-hang": (comp_branch_hang(), {"tr": (0, 0), "tl": (1, 0)}),
        "camellia-single": (comp_camellia_single(), {"bl": (0, 0), "br": (1, 0)}),
    }
    manifest = {"compositions": {}, "ornaments": {}, "corners": {}}
    for name, (sc, corners) in comps.items():
        manifest["compositions"][name] = {"w": sc.w, "h": sc.h, "plates": write_scene(sc, name, corners)}
    manifest["ornaments"] = ornaments()
    for name, fn in (("acanthus", corner_acanthus), ("floral", corner_floral), ("loop", corner_loop)):
        write_solid(fn(), f"corner-{name}", CORNER["W"], CORNER["W"], MIRROR)
    # the vintage suite's mark at the middle of the head and foot rules: the
    # pack's medallion, and its mirror for the foot
    med, (mw, mh) = pack("medallion")
    write_solid(med, "mid", mw, mh, {"top": (0, 0), "bottom": (0, 1)})
    W = CORNER["W"]
    manifest["corners"] = {"outer": CORNER["o"] / W, "inner": CORNER["i"] / W,
                           "outerW": CORNER["wo"] / W, "innerW": CORNER["wi"] / W}
    with open(os.path.join(ROOT, "src", "lib", "stationery-art.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(len(os.listdir(OUT)), "files,", round(total / 1024), "KB")


if __name__ == "__main__":
    main()

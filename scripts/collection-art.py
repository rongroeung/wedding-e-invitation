"""
Artwork for the thirty paper designs (three collections of ten).

Builds on scripts/stationery-art.py (its flowers, its foil helpers, its
reading of the couple's vintage pack) and adds what the three collections
need. No lotus anywhere.

Khmer ornament (collection A) and Khmer sculpture (collection B) — all of it
is a *contemporary interpretation*, drawn here, of motifs and structures one
can see in Angkorean stone; none of it is traced from a monument or claimed
to be a specific historical motif:

    phka chan      a four-petalled flower in a square, as in the diaper
                   rosettes carved over the walls of Angkor-period temples
    diaper tile    a seamless lattice of those flowers on a fine diamond grid
    garland band   a lintel-like band: a beaded rail with swags of leaves
                   and small hanging drops between them
    balusters      a row of turned balusters between two rails, after the
                   turned stone balusters of temple windows
    colonnette     a slender shaft ringed at intervals, after the ringed
                   colonnettes that flank temple doorways
    lozenge frieze a run of framed panels, each with a lozenge and a flower
    arch           a lobed arch with curled ends, for the head of a page
    kbach corner   the flame-leaf bouquet from the kbach kit (itself drawn
                   by scripts/design-kits.py), turned into a corner

Flowers (collection C) add a vintage rose (layered, rolled petals, toothed
leaflets, thorned stem) to the camellia, small blossom and branches, and
arrange them as a rose spray, a mixed garden corner, a head arrangement, and
a running vine for borders.

Each piece is written either as printed plates (petal · leaf · heart · line
· foil, like stationery-art.py) or as one solid shape that a paper prints in
foil, in ink, engraved, embossed or blind. Band and tile pieces repeat
seamlessly; vertical bands are the horizontal drawing turned inside the SVG.

usage: python3 scripts/collection-art.py
"""
import importlib.util
import json
import math
import os

import numpy as np
from shapely import affinity
from shapely.geometry import LineString, MultiLineString, MultiPolygon, Point, Polygon, box
from shapely.ops import unary_union

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("sa", os.path.join(HERE, "stationery-art.py"))
sa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sa)

ROOT = sa.ROOT
OUT = os.path.join(ROOT, "public", "art", "collection")
os.makedirs(OUT, exist_ok=True)
sa.OUT = OUT
KITS = os.path.join(ROOT, "public", "kit", "sets")

cubic, chain, resample, tf, gtf, ribbon = sa.cubic, sa.chain, sa.resample, sa.tf, sa.gtf, sa.ribbon
Item, Scene, dot = sa.Item, sa.Scene, sa.dot
W_OUT, W_VEIN, W_HATCH = sa.W_OUT, sa.W_VEIN, sa.W_HATCH
RNG = np.random.default_rng(23)

MANIFEST = {"scenes": {}, "solids": {}}


# ── output helpers ─────────────────────────────────────────────────────────

def solid(g, name, W, H, variants=None):
    """A one-shape piece; variants mirror it inside the SVG."""
    sa.write_solid(g, name, W, H, variants)
    MANIFEST["solids"][name] = {"w": W, "h": H, "variants": list((variants or {"": 0}).keys())}


def scene(sc, name, variants):
    MANIFEST["scenes"][name] = {"w": sc.w, "h": sc.h, "plates": sa.write_scene(sc, name, variants)}


def turned(g, W, H):
    """The horizontal drawing turned a quarter, for a vertical band."""
    g = affinity.rotate(g, 90, origin=(0, 0))
    return affinity.translate(g, H, 0)


def shape_from_svg(path, drop=None):
    """A kit SVG (scripts/design-kits.py) as a shapely shape: its filled
    paths, its stroked paths at their stroke width, less the lines its mask
    knocks out."""
    import xml.etree.ElementTree as ET
    from svgpathtools import parse_path

    ns = "{http://www.w3.org/2000/svg}"
    root = ET.parse(path).getroot()
    vb = [float(v) for v in root.get("viewBox").split()]

    def geom(el):
        d = el.get("d")
        if not d:
            return None
        pth = parse_path(d)
        pts = []
        for seg in pth:
            n = max(2, int(seg.length() / 1.2))
            for t in np.linspace(0, 1, n, endpoint=False):
                z = seg.point(t)
                pts.append((z.real, z.imag))
        z = pth.end
        pts.append((z.real, z.imag))
        sw = el.get("stroke-width")
        fill = el.get("fill")
        if fill == "none" or (sw and el.get("stroke") and fill is None and el.tag.endswith("path") and False):
            return LineString(pts).buffer(float(sw or 1) / 2, cap_style=1) if len(pts) > 1 else None
        if len(pts) < 3:
            return None
        return Polygon(pts).buffer(0)

    cuts, keep = [], []
    for m in root.iter(ns + "mask"):
        for el in m.iter(ns + "path"):
            g = geom(el)
            if g is not None:
                cuts.append(g)
    for grp in root.iter(ns + "g"):
        inherit_fill = grp.get("fill")
        for el in grp.iter(ns + "path"):
            if el.get("fill") is None and inherit_fill:
                el.set("fill", inherit_fill)
            g = geom(el)
            if g is not None and not g.is_empty:
                keep.append(g)
    shape = unary_union(keep)
    if cuts:
        shape = shape.difference(unary_union(cuts))
    return shape, (vb[2], vb[3])


def engraved(g, spacing=4.2, angle=-35, w_out=1.6, w_hatch=0.75, shade=0.55):
    """A solid shape redrawn as an engraving: its outlines, and hatching that
    fills only the side of each form turned from the light (bottom right),
    so the shape reads as modelled rather than filled."""
    it = Item()
    it.sil = g
    for p in getattr(g, "geoms", [g]):
        if not isinstance(p, Polygon):
            continue
        it.line("line", np.array(p.exterior.coords), w_out)
        for r in p.interiors:
            it.line("line", np.array(r.coords), w_out * 0.8)
    x0, y0, x1, y1 = g.bounds
    span = max(x1 - x0, y1 - y0) * 1.5
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    a = math.radians(angle)
    d = np.array([math.cos(a), math.sin(a)])
    n = np.array([-d[1], d[0]])
    # the shaded part: what lies within the shape but not within the shape
    # shifted towards the light
    lit = affinity.translate(g, -spacing * 1.6, -spacing * 1.6)
    shadow = g.difference(lit).buffer(0)
    k = -span
    while k < span:
        o = np.array([cx, cy]) + n * k
        ln = LineString([o - d * span, o + d * span])
        seg = ln.intersection(shadow if shade else g)
        for s in sa.lines_of(seg):
            if LineString(s).length > 1.5:
                it.line("line", s, w_hatch)
        k += spacing
    return it


# ── Khmer ornament ─────────────────────────────────────────────────────────

def phka_chan(r=1.0, gap=0.06, detail=True):
    """Four pointed petals on the axes, four small leaf-points on the
    diagonals, a round heart ringed with dots — the four-petalled flower in a
    square. Solid, with fine knock-out lines."""
    parts = []
    for k in range(4):
        a = k * 90
        petal = Polygon(chain(((0, -0.18), (0.26, -0.3), (0.3, -0.72), (0, -1.0)),
                              ((0, -1.0), (-0.3, -0.72), (-0.26, -0.3), (0, -0.18)))).buffer(0)
        parts.append(affinity.rotate(petal, a, origin=(0, 0)))
        small = Polygon(chain(((0, -0.22), (0.13, -0.32), (0.14, -0.52), (0, -0.66)),
                              ((0, -0.66), (-0.14, -0.52), (-0.13, -0.32), (0, -0.22)))).buffer(0)
        parts.append(affinity.rotate(small, a + 45, origin=(0, 0)))
    body = unary_union(parts)
    cuts = []
    if detail:
        for k in range(4):
            cuts.append(LineString(tf(cubic((0, -0.34), (0, -0.5), (0, -0.62), (0, -0.82), 10), 1, k * 90)).buffer(0.025))
    body = body.difference(Point(0, 0).buffer(0.26 + gap, 32)).difference(unary_union(cuts) if cuts else Polygon())
    heart = Point(0, 0).buffer(0.26, 32).difference(Point(0, 0).buffer(0.17, 32))
    dots = [Point(math.cos(t) * 0.08, math.sin(t) * 0.08).buffer(0.03, 8) for t in np.linspace(0, 2 * math.pi, 6)[:-1]]
    g = unary_union([body, heart, Point(0, 0).buffer(0.05, 12), *dots] if detail else [body, Point(0, 0).buffer(0.2, 24)])
    return affinity.scale(g, r, r, origin=(0, 0))


def tile_diaper():
    """A seamless tile: a phka chan in each square of a fine diamond lattice."""
    T = 120
    parts = []
    c = T / 2
    lines = [((0, c), (c, 0)), ((c, 0), (T, c)), ((T, c), (c, T)), ((c, T), (0, c))]
    for a, b in lines:
        parts.append(LineString([a, b]).buffer(0.55))
    parts.append(affinity.translate(phka_chan(17), c, c))
    for (x, y) in ((0, 0), (T, 0), (0, T), (T, T)):
        parts.append(Point(x, y).buffer(2.4, 12))
    g = unary_union(parts).intersection(box(0, 0, T, T))
    solid(g, "tile-diaper", T, T)


def band_garland():
    """A lintel-like band: a beaded rail along the top, swags of small
    leaves hanging between ties, a drop at each tie. Seamless along x."""
    W, H = 240, 96
    parts = [box(0, 8, W, 10.2)]
    for x in np.arange(6, W, 12):
        parts.append(Point(x, 16, ).buffer(2.6, 12))
    parts.append(box(0, 21.5, W, 22.6))
    for x0 in (0, W):
        # the tie and its drop
        parts.append(Polygon([(x0 - 5, 22), (x0 + 5, 22), (x0 + 2.4, 34), (x0 - 2.4, 34)]))
        drop = Polygon(chain(((x0, 34), (x0 + 7, 44), (x0 + 6, 58), (x0, 68)), ((x0, 68), (x0 - 6, 58), (x0 - 7, 44), (x0, 34))))
        parts.append(drop.buffer(0).difference(LineString([(x0, 42), (x0, 62)]).buffer(0.9)))
        parts.append(Point(x0, 74).buffer(3.2, 12))
        parts.append(Point(x0, 82).buffer(2.0, 10))
    # the swag: leaves laid along a hanging curve, pointing to the centre
    sw = cubic((12, 28), (70, 76), (170, 76), (228, 28), 60)
    parts.append(ribbon(sw, 1.6, 1.6)[0])
    n = len(sw)
    for i in range(3, n - 3, 4):
        d = sw[i + 1] - sw[i - 1]
        th = math.degrees(math.atan2(d[1], d[0]))
        towards = 1 if i < n / 2 else -1
        for side in (1, -1):
            parts.append(sa.foil_leaf(sw[i][0], sw[i][1], 12, 3.2, th + 90 * towards + side * 50 * towards + (0 if towards > 0 else 0),
                                      cut=0.6))
    parts.append(affinity.translate(phka_chan(9, detail=False), W / 2, 62))
    g = unary_union(parts).intersection(box(0, 0, W, H))
    solid(g, "band-garland", W, H, {"t": (0, 0), "b": (0, 1)})


def band_balusters():
    """Turned balusters between two rails — after the stone balusters of
    temple windows. One baluster per tile; seamless along x."""
    W, H = 44, 120
    cx = W / 2
    prof = [  # (y, half-width) down the baluster: rings, bulbs, necks
        (14, 6), (17, 9), (20, 9), (22, 6), (26, 5), (29, 8), (32, 8), (35, 5), (42, 7.5), (52, 9.5), (60, 6.5),
        (63, 9), (66, 9), (69, 5.5), (76, 9.5), (86, 7.5), (93, 5), (96, 8), (99, 8), (102, 5), (104, 9), (107, 9),
        (110, 6)]
    ys = np.array([p[0] for p in prof], float)
    ws = np.array([p[1] for p in prof], float)
    yy = np.linspace(ys[0], ys[-1], 200)
    ww = np.interp(yy, ys, ws)
    outline = np.vstack([np.c_[cx + ww, yy], np.c_[cx - ww, yy][::-1]])
    bal = Polygon(outline).buffer(0)
    # the turned rings, cut as fine lines
    cuts = [LineString([(cx - 12, y), (cx + 12, y)]).buffer(0.5) for y in (17, 20, 32, 63, 66, 96, 99, 104)]
    bal = bal.difference(unary_union(cuts))
    rails = [box(0, 4, W, 9), box(0, 10.5, W, 11.5), box(0, 111, W, 116), box(0, 108.5, W, 109.5)]
    g = unary_union([bal, *rails])
    solid(g, "band-balusters", W, H, {"t": (0, 0), "b": (0, 1)})


def band_colonnette():
    """A ringed colonnette, standing along a side: a shaft between two edge
    lines with groups of rings; seamless along its length (drawn
    horizontally, turned for the sides)."""
    W, H = 160, 40
    cy = H / 2
    parts = [box(0, cy - 9, W, cy - 8), box(0, cy + 8, W, cy + 9), box(0, cy - 0.4, W, cy + 0.4)]
    for x0 in (40, 120):
        for dx, hw, t in ((-9, 13, 2.2), (-4, 15, 3.4), (0, 17, 4.2), (4, 15, 3.4), (9, 13, 2.2)):
            x = x0 + dx
            parts.append(Polygon([(x - t / 2, cy - hw), (x + t / 2, cy - hw), (x + t / 2, cy + hw), (x - t / 2, cy + hw)]).buffer(0.6))
        parts.append(affinity.translate(phka_chan(5.5, detail=False), x0 + 40 if x0 == 40 else x0 - 40, cy))
    g = unary_union(parts).intersection(box(0, 0, W, H))
    # the side bands run top to bottom: the drawing turned inside the SVG
    sa.write_solid(turned(g, W, H), "band-colonnette-v", H, W)
    MANIFEST["solids"]["band-colonnette-v"] = {"w": H, "h": W, "variants": [""]}


def band_lozenge():
    """A frieze of framed panels: each a square frame with a lozenge and a
    phka chan inside; seamless along x."""
    W, H = 70, 70
    parts = [box(0, 2, W, 3.4), box(0, 66.6, W, 68), box(0, 6, W, 6.8), box(0, 63.2, W, 64)]
    parts.append(box(0, 6, 1.0, 64))
    parts.append(box(W - 1.0, 6, W, 64))
    cx, cy = W / 2, H / 2
    lz = Polygon([(cx, 11), (W - 9, cy), (cx, H - 11), (9, cy)])
    parts.append(lz.exterior.buffer(0.8))
    parts.append(lz.buffer(-4).exterior.buffer(0.45))
    parts.append(affinity.translate(phka_chan(13), cx, cy))
    for (x, y) in ((6, 10), (W - 6, 10), (6, H - 10), (W - 6, H - 10)):
        parts.append(Point(x, y).buffer(1.6, 10))
    g = unary_union(parts).intersection(box(0, 0, W, H))
    solid(g, "band-lozenge", W, H, {"t": (0, 0), "b": (0, 1)})


def band_scroll():
    """A running scroll for a continuous border: the pack's twin scroll,
    repeated end to end with a small rosette at each join."""
    sc, (w, h) = sa.pack("scroll-twin")
    s = 70 / h
    g = gtf(sc, s=s)
    W, H = w * s + 22, 80
    g = affinity.translate(g, 11, (H - h * s) / 2)
    parts = [g]
    for x in (0, W):
        parts.append(affinity.translate(phka_chan(8, detail=False), x, H / 2))
    g = unary_union(parts).intersection(box(0, 0, W, H))
    solid(g, "band-scroll", round(W, 1), H, {"t": (0, 0), "b": (0, 1)})
    sa.write_solid(turned(g, W, H), "band-scroll-v", H, round(W, 1))
    MANIFEST["solids"]["band-scroll-v"] = {"w": H, "h": round(W, 1), "variants": [""]}


def arch_crest():
    """A lobed arch for the head of the page: a band rising over five lobes,
    a fine inner line following it, its ends turning into curls, and a
    phka chan at the crown."""
    W, H = 640, 250
    cx, base = W / 2, 236
    # the arch: an ellipse's upper half, broken into five scalloped lobes
    t = np.linspace(math.pi, 0, 400)
    rx, ry = 270, 190
    x = cx + rx * np.cos(t)
    y = base - ry * np.sin(t)
    lobes = 5
    phase = (t - math.pi) / -math.pi * lobes
    bulge = 15 * np.abs(np.sin(math.pi * phase))
    nx, ny = np.cos(t) / rx, np.sin(t) / ry
    nn = np.c_[nx, -ny]
    nn /= np.linalg.norm(nn, axis=1)[:, None]
    outer = np.c_[x, y] + nn * bulge[:, None]
    parts = [ribbon(outer, 7.0, 7.0)[0]]
    inner = np.c_[x, y] - nn * 13
    parts.append(ribbon(inner, 2.0, 2.0)[0])
    parts.append(ribbon(np.c_[x, y] - nn * 20, 0.9, 0.9)[0])
    # flame-like leaves standing out along the arch, leaning towards its foot
    for k in range(1, 18):
        if k % 3 == 0:
            continue
        i = int(len(t) * k / 18)
        th = math.degrees(math.atan2(nn[i][1], nn[i][0])) + 90
        lean = -14 if x[i] < cx else 14
        p = outer[i] + nn[i] * 3
        parts.append(sa.foil_leaf(p[0], p[1], 26, 7, th + lean, curl=0.18 * (1 if x[i] < cx else -1), cut=0.8))
    # cusp points at each lobe join, and beads
    for k in range(1, lobes):
        i = int(len(t) * k / lobes)
        p = outer[i] + nn[i] * 4
        parts.append(Point(*p).buffer(3.2, 12))
    for side in (-1, 1):
        end = np.array([cx + side * rx, base])
        parts.append(sa.curl_line(end, 90 + side * 90, 110, sgn=side, w=6.0, turns=1.6))
        parts.append(sa.foil_leaf(end[0] - side * 4, end[1] - 30, 34, 8, -side * 30, curl=0.1 * side, cut=0.9))
    parts.append(affinity.translate(phka_chan(22), cx, base - ry - 30))
    g = unary_union(parts)
    solid(g, "arch", W, H)


def kbach_corner():
    """The flame bouquet of the kbach kit turned into a corner, on the fine
    double rule."""
    fl, (w, h) = shape_from_svg(os.path.join(KITS, "kbach-phni", "crest.svg"))
    x0, y0, x1, y1 = fl.bounds
    fl = affinity.translate(fl, -(x0 + x1) / 2, -y1)  # its base at the origin
    s = 210 / (x1 - x0)
    fl = gtf(fl, s=s, rot=135)
    i = sa.CORNER["i"]
    fl = affinity.translate(fl, i + 6 - fl.bounds[0], i + 6 - fl.bounds[1])
    g = unary_union([sa.double_rule_corner(), fl])
    solid(g, "corner-kbach", 400, 400, sa.MIRROR)


def kbach_crest_solid():
    """The kit's flame crest and its medallion, as solid pieces for the head
    and foot of a page."""
    for kit, role, name in (("kbach-phni", "crest", "kbach-crest"), ("kbach-naga", "crest", "naga-crest"),
                            ("kbach-phni", "medallion", "kbach-medallion")):
        g, (w, h) = shape_from_svg(os.path.join(KITS, kit, f"{role}.svg"))
        x0, y0, x1, y1 = g.bounds
        g = affinity.translate(g, -x0 + 4, -y0 + 4)
        solid(g, name, round(x1 - x0 + 8, 1), round(y1 - y0 + 8, 1), {"": (0, 0), "flip": (0, 1)})


def corner_phka():
    """A spare corner: the rules, and a phka chan on the diagonal with two
    fine rules running from it."""
    i = sa.CORNER["i"]
    c = i + 30
    parts = [sa.double_rule_corner(), affinity.translate(phka_chan(24), c, c)]
    for (a, b) in (((c + 30, c), (c + 150, c)), ((c, c + 30), (c, c + 150))):
        parts.append(LineString([a, b]).buffer(0.7))
    parts.append(dot(c + 158, c, 2.4))
    parts.append(dot(c, c + 158, 2.4))
    solid(unary_union(parts), "corner-phka", 400, 400, sa.MIRROR)


def corner_single_rule(ornament):
    """Corners on a single fine rule (for the lighter designs)."""
    W, o = 400, 26
    parts = [box(o + 26, o - 1, W, o + 1), box(o - 1, o + 26, o + 1, W)]
    arc = [(o + 26 * math.sin(a), o + 26 * math.cos(a)) for a in np.linspace(0, math.pi / 2, 24)]
    parts.append(LineString(arc).buffer(1.0))
    parts.append(ornament)
    return unary_union(parts)


def pack_engraved():
    """The pack's acanthus corner and crest redrawn as engravings — outline
    and hatching — for the engraved designs (printed, not foil)."""
    acan, _ = sa.pack("corner", drop=lambda bb: sa.long_thin(bb) or (bb[0] > 290 and bb[1] < 60) or (bb[1] > 330 and bb[0] < 60))
    x0, y0, x1, y1 = acan.bounds
    acan = gtf(affinity.translate(acan, -x0, -y0), s=520 / max(x1 - x0, y1 - y0), dx=20, dy=20)
    sc = Scene(600, 600)
    sc.add(engraved(acan, spacing=5, w_out=2.2, w_hatch=1.0))
    scene(sc, "engraved-corner", sa.MIRROR)
    cr, (w, h) = sa.pack("crest")
    s = 900 / w
    sc = Scene(960, round(h * s + 40))
    sc.add(engraved(gtf(cr, s=s, dx=30, dy=20), spacing=5, w_out=2.2, w_hatch=1.0))
    scene(sc, "engraved-crest", {"": (0, 0), "flip": (0, 1)})


# ── flowers ────────────────────────────────────────────────────────────────

def rose_petal(L, W):
    """A rose petal: broad, its edge rolled back at the top — the rolled
    lip drawn as a second line just inside the edge."""
    return sa.camellia_petal(L, W, W, notch=0.0)


def rose(sc, x, y, s, rot=0.0, tilt=1.0):
    """A full vintage rose, three-quarter face: an outer ring of broad
    petals with rolled lips, a cupped middle of crescent petals wrapping
    round the heart, and the heart itself a tight spiral."""
    k = dict(s=s, rot=rot, dx=x, dy=y, sy=tilt)
    for i in range(6):
        a = i * 60 + RNG.uniform(-6, 6)
        l, r = rose_petal(1.0, 0.5)
        it = sa.petal_item(l, r, veins=5, base_hatch=0.3, rim_side=1 if i % 2 else -1)
        # the rolled lip
        lip = resample(np.vstack([l[::-1], r[1:]]), 80)[22:58]
        it.line("line", lip * [0.86, 0.9] + [0, -0.02], W_VEIN)
        sc.add(it.moved(rot=a).moved(**k))
    # the heart: a cup of petals wrapping round each other. Drawn as their
    # rolled top edges — open curves turning about a drifting centre, each a
    # little larger and further round than the last — over one wash.
    heart = Item()
    disc = affinity.scale(Point(0, 0).buffer(0.6, 64), 1.0, 0.92)
    heart.sil = disc
    heart.fill("petal", disc, (0, 0.3, 0, -0.6))
    heart.line("line", np.array(disc.exterior.coords)[8:40], W_OUT)
    for j in range(9):
        r = 0.08 + 0.065 * j
        a0 = math.radians(j * 83 + 20)
        span = math.radians(150 + 14 * j)
        c = np.array([0.025 * j * math.cos(a0 * 0.5), 0.02 * j * math.sin(a0 * 0.5) - 0.02 * j])
        ts = np.linspace(a0, a0 + span, 40)
        arc = c + np.c_[np.cos(ts) * r, np.sin(ts) * r * 0.86]
        heart.line("line", arc, W_OUT * 0.85 if j > 2 else W_VEIN)
        # shade inside each lip
        for q in range(6, 34, 5):
            p = arc[q]
            heart.line("line", [p, p + (c - p) * 0.22], W_HATCH * 0.8)
    sc.add(heart.moved(**k))
    sc.add(Item().line("foil", tf([(math.cos(t) * 0.07, math.sin(t) * 0.06) for t in np.linspace(0, 4.5, 24)], s, rot, x, y,
                                    sy=tilt), W_VEIN * 1.2))


def rose_bud(sc, x, y, s, rot=0.0):
    it = Item()
    body = Polygon(chain(((0, 0), (0.42, -0.2), (0.38, -0.75), (0.05, -1.1)), ((0.05, -1.1), (-0.3, -0.8), (-0.42, -0.25), (0, 0)))).buffer(0)
    it.sil = body
    it.fill("petal", body, (0, 0, 0, -1.1))
    it.line("line", np.array(body.exterior.coords), W_OUT)
    it.line("line", cubic((-0.3, -0.35), (0.0, -0.55), (0.2, -0.85), (0.05, -1.08), 16), W_VEIN)
    sc.add(it.moved(s=s, rot=rot, dx=x, dy=y))
    for a in (-38, 38, 0):
        sep = Item()
        p = Polygon(chain(((0, 0.05), (0.08, -0.2), (0.06, -0.45), (0, -0.62)), ((0, -0.62), (-0.06, -0.45), (-0.08, -0.2), (0, 0.05)))).buffer(0)
        p = affinity.rotate(p, a, origin=(0, 0))
        sep.sil = p
        sep.fill("leaf", p)
        sep.line("line", np.array(p.exterior.coords), W_OUT * 0.8)
        sc.add(sep.moved(s=s, rot=rot, dx=x, dy=y))


def rose_leaf(sc, x, y, L, rot):
    """A rose leaf: a short stalk carrying a terminal leaflet and two pairs
    of side leaflets, each toothed."""
    stalk = tf([(0, 0), (0, -L)], 1, rot, x, y)
    sa.stem(sc, [stalk[0], stalk[0] * 0.66 + stalk[1] * 0.34, stalk[0] * 0.33 + stalk[1] * 0.67, stalk[1]], 2.6, 1.8)
    for u, side, size in ((0.38, 1, 0.42), (0.38, -1, 0.42), (0.72, 1, 0.5), (0.72, -1, 0.5)):
        p = stalk[0] + (stalk[1] - stalk[0]) * u
        sa.leaf(sc, p[0], p[1], L * size, L * size * 0.36, rot + side * 62, curl=0.06 * side, veins=5, teeth=12)
    sa.leaf(sc, stalk[1][0], stalk[1][1], L * 0.6, L * 0.22, rot, veins=6, teeth=14)


def thorned_stem(sc, pts, w0, w1):
    c = sa.stem(sc, pts, w0, w1)
    for i in range(8, len(c) - 8, 13):
        d = c[i + 1] - c[i - 1]
        nrm = np.array([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-9)
        side = 1 if (i // 13) % 2 else -1
        base = c[i] + nrm * side * w0 * 0.45
        tip = base + nrm * side * 9 - d / (np.linalg.norm(d) + 1e-9) * 6
        th = Polygon([base - d / np.linalg.norm(d) * 3, base + d / np.linalg.norm(d) * 3, tip]).buffer(0)
        it = Item()
        it.sil = th
        it.fill("leaf", th)
        it.line("line", np.array(th.exterior.coords), W_HATCH)
        sc.add(it)
    return c


def comp_rose_spray():
    """Roses laid along the foot from the lower left: one full rose, one
    turned away, buds and leaves, the spray running out to the right — a
    horizontal arrangement, where the camellia spray climbs."""
    sc = Scene(1000, 1000)
    thorned_stem(sc, [(150, 990), (330, 940), (560, 930), (840, 900)], 7, 4)
    for (x, y, L, r) in ((420, 930, 130, -40), (560, 925, 120, 20), (700, 912, 110, -30), (300, 950, 120, -80), (250, 880, 120, -10)):
        rose_leaf(sc, x, y, L, r)
    thorned_stem(sc, [(330, 940), (380, 880), (410, 820), (420, 760)], 5, 4)
    rose_bud(sc, 420, 762, 62, rot=8)
    thorned_stem(sc, [(700, 912), (760, 880), (800, 860), (850, 846)], 4, 3)
    rose_bud(sc, 852, 846, 46, rot=70)
    rose(sc, 520, 870, 74, rot=-20, tilt=0.72)
    rose(sc, 250, 860, 112, rot=10)
    return sc


def comp_rose_single():
    sc = Scene(600, 600)
    thorned_stem(sc, [(120, 600), (150, 520), (190, 470), (230, 430)], 6, 4.5)
    rose_leaf(sc, 165, 500, 130, -50)
    rose_leaf(sc, 200, 470, 110, 60)
    rose_bud(sc, 340, 360, 48, rot=50)
    sa.stem(sc, [(220, 440), (270, 400), (310, 380), (338, 364)], 4, 3)
    rose(sc, 230, 400, 96, rot=-8)
    return sc


def comp_garden_corner():
    """A mixed corner of the garden: a rose with a camellia beside it, small
    blossoms and buds tucked round them, leaves of both radiating out — the
    rose primary, the camellia second, the blossoms the small change."""
    sc = Scene(1000, 1000)
    sa.vine(sc, [(80, 720), (60, 560), (90, 400), (70, 260)], w=3.6,
            leaves=[(0.15, 1, 52), (0.35, -1, 46), (0.55, 1, 40), (0.75, -1, 34)],
            blossoms=[(0.45, -1, 24), (0.85, 1, 18)], buds=[(0.95, -1, 16)], sgn=1)
    for (x, y, L, r) in ((260, 840, 150, -60), (340, 860, 140, 30)):
        rose_leaf(sc, x, y, L, r)
    for (lx, ly, L, r, cu) in ((420, 880, 150, 70, -0.08), (180, 860, 140, -100, 0.08)):
        sa.leaf(sc, lx, ly, L, L * 0.36, r, curl=cu)
    sa.stem(sc, [(150, 1000), (220, 930), (280, 880), (330, 840)], 7, 5)
    for (bx, by, s_) in ((460, 760, 26), (500, 800, 22), (150, 760, 24)):
        sa.blossom(sc, bx, by, s_, rot=RNG.uniform(0, 72))
    sa.blossom_bud(sc, 520, 740, 20, -60)
    rose_bud(sc, 120, 700, 44, rot=-30)
    sa.camellia(sc, 430, 860, 88, rot=20, tilt=0.8, rings=(6, 5, 4))
    rose(sc, 270, 820, 110, rot=-6)
    return sc


def comp_garden_head():
    """The head arrangement for the grandest floral page: a rose at the
    centre, a camellia either side, small blossoms and leaves sweeping out
    to buds at the ends. Symmetrical in its masses, not mirrored leaf for
    leaf."""
    sc = Scene(1000, 360)
    cx, cy = 500, 200
    for side in (-1, 1):
        sa.stem(sc, [(cx, cy + 20), (cx + side * 160, cy + 50), (cx + side * 300, cy + 10), (cx + side * 420, cy - 20)], 4.5, 3)
        for k, (u, L) in enumerate(((140, 110), (230, 100), (320, 86), (390, 70))):
            sa.leaf(sc, cx + side * u, cy + 40 - k * 12, L, L * 0.34, side * (70 + k * 6) + (0 if k % 2 else 30 * side),
                    curl=0.08 * side, veins=5)
        for (u, dy, s_) in ((250, 10, 24), (340, -10, 20), (380, 30, 16)):
            sa.blossom(sc, cx + side * u, cy + dy, s_, rot=RNG.uniform(0, 72))
        sa.blossom_bud(sc, cx + side * 425, cy - 22, 16, side * 70)
        sa.camellia(sc, cx + side * 150, cy + 24, 66, rot=side * 14, tilt=0.8, rings=(6, 5, 4))
    for side in (-1, 1):
        rose_leaf(sc, cx + side * 40, cy + 60, 120, side * 120)
    rose(sc, cx, cy, 92, rot=0, tilt=0.86)
    return sc


def band_vine():
    """A running vine for a border: one fine stem waving through each tile
    and out at the same height and slope, a leaf on each side of every wave
    and a small blossom at its crest — drawn as an engraving (outlines and
    a midrib), light enough to run the length of a page."""
    W, H = 360, 120
    xs = np.linspace(-20, W + 20, 260)
    ys = H / 2 + 16 * np.sin(2 * math.pi * xs / W)
    parts = [LineString(np.c_[xs, ys]).buffer(1.1, cap_style=1)]

    def y_at(x):
        return H / 2 + 16 * math.sin(2 * math.pi * x / W)

    def slope(x):
        return math.degrees(math.atan(16 * 2 * math.pi / W * math.cos(2 * math.pi * x / W)))

    for (x, side, L) in ((52, -1, 40), (128, 1, 34), (232, 1, 40), (308, -1, 34)):
        y = y_at(x)
        th = slope(x)
        rot = th + 90 + (-56 if side < 0 else 56 + 180)
        tip_side = -1 if side < 0 else 1
        lf = sa.foil_leaf(x, y, L, L * 0.3, rot, curl=0.12 * tip_side, cut=1.0)
        # outline only: the leaf as an engraved line, its midrib kept
        parts.append(lf.exterior.buffer(0.7) if isinstance(lf, Polygon) else unary_union([g.exterior.buffer(0.7) for g in lf.geoms]))
        parts.append(LineString(tf(cubic((0, -2), (0, -L * 0.3), (0, -L * 0.6), (0, -L * 0.85), 10), 1, rot, x, y)).buffer(0.45))
    for x in (180,):
        y = y_at(x) - 3
        parts.append(sa.foil_blossom(x, y, 12))
        parts.append(sa.foil_bud(x + 26, y + 6, 12, 60))
    g = unary_union(parts).intersection(box(0, 0, W, H))
    solid(g, "band-vine", W, H, {"t": (0, 0), "b": (0, 1)})
    sa.write_solid(turned(g, W, H), "band-vine-v", H, W)
    MANIFEST["solids"]["band-vine-v"] = {"w": H, "h": W, "variants": [""]}


def main():
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))
    tile_diaper()
    band_garland()
    band_balusters()
    band_colonnette()
    band_lozenge()
    band_scroll()
    band_vine()
    arch_crest()
    kbach_crest_solid()
    corner_phka()
    i = sa.CORNER["i"]
    # light corners on a single rule: a small rosette, or a blossom sprig
    solid(corner_single_rule(affinity.translate(phka_chan(16), 44, 44)), "corner-single-phka", 400, 400, sa.MIRROR)
    solid(corner_single_rule(unary_union([sa.foil_blossom(46, 46, 14),
                                          sa.sprig((62, 40), (190, 32), side=-1, leaves=4, L=20, bend=0.06),
                                          sa.sprig((40, 62), (32, 190), side=1, leaves=4, L=20, bend=0.06)])),
          "corner-single-sprig", 400, 400, sa.MIRROR)
    # plain corners: the rules alone, for designs whose corners are carried
    # by printed or carved artwork instead
    solid(sa.double_rule_corner(), "corner-plain-double", 400, 400, sa.MIRROR)
    solid(corner_single_rule(Point(0, 0).buffer(0.01)), "corner-plain-single", 400, 400, sa.MIRROR)
    # pack pieces kept as solids for relief and foil use
    for name in ("scroll-bow", "scroll-knot", "medallion", "rosette-c", "corner-loop"):
        g, (w, h) = sa.pack(name)
        solid(g, f"pack-{name}", w, h, {"": (0, 0), "flip": (0, 1)} if name != "corner-loop" else sa.MIRROR)
    acan, _ = sa.pack("corner", drop=lambda bb: sa.long_thin(bb) or (bb[0] > 290 and bb[1] < 60) or (bb[1] > 330 and bb[0] < 60))
    x0, y0, x1, y1 = acan.bounds
    solid(affinity.translate(acan, -x0 + 4, -y0 + 4), "pack-acanthus", round(x1 - x0 + 8, 1), round(y1 - y0 + 8, 1), sa.MIRROR)
    phka = phka_chan(46)
    solid(affinity.translate(phka, 50, 50), "mark-phka", 100, 100)
    pack_engraved()
    scene(comp_rose_spray(), "rose-spray", {"bl": (0, 0), "br": (1, 0)})
    scene(comp_rose_single(), "rose-single", {"bl": (0, 0), "br": (1, 0), "tl": (0, 1), "tr": (1, 1)})
    scene(comp_garden_corner(), "garden-corner", {"bl": (0, 0), "br": (1, 0)})
    scene(comp_garden_head(), "garden-head", {"tc": (0, 0), "bc": (0, 1)})
    # the stationery flowers, written again here with every corner they may need
    sa.OUT = OUT
    scene(sa.comp_camellia_spray(), "camellia-spray", {"bl": (0, 0), "br": (1, 0), "tl": (0, 1), "tr": (1, 1)})
    scene(sa.comp_branch_hang(), "branch-hang", {"tr": (0, 0), "tl": (1, 0), "br": (0, 1), "bl": (1, 1)})
    scene(sa.comp_camellia_single(), "camellia-single", {"bl": (0, 0), "br": (1, 0), "tl": (0, 1), "tr": (1, 1)})
    with open(os.path.join(ROOT, "src", "lib", "collection-art.json"), "w") as fh:
        json.dump(MANIFEST, fh, indent=1)
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(len(os.listdir(OUT)), "files,", round(total / 1024), "KB")


if __name__ == "__main__":
    main()

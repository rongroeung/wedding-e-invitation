"""Corner halos: each frame corner's drawing, widened a little and filled, as
the shape the scrolling invitation fades out of (globals.css, "The letter,
rule to rule"). The words come right up to the gold but never run under it.

    python3 scripts/corner-halos.py

Reads public/art/{stationery,collection}/<corner>-{tl,tr,bl,br}.svg for every
corner a paper design uses (src/lib/paper-themes.json) and writes
<corner>-halo-{tl,tr,bl,br}.svg next to them.
"""
import json, re
from pathlib import Path
import numpy as np
from svgpathtools import parse_path
from shapely.geometry import Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
MARGIN = 0.05            # of the corner's width: the clear space kept round the gold
SMOOTH = 0.025           # rounds the halo, so the fade edge is calm

def shapes(svg_text):
    polys = []
    for d in re.findall(r'\bd="([^"]+)"', svg_text):
        path = parse_path(d)
        for sub in path.continuous_subpaths():
            n = max(8, int(sub.length() / 2))
            pts = [sub.point(t) for t in np.linspace(0, 1, n)]
            ring = [(p.real, p.imag) for p in pts]
            if len(ring) >= 3:
                g = Polygon(ring).buffer(0)
                if not g.is_empty:
                    polys.append(g)
    return unary_union(polys)

def fill(g):
    parts = getattr(g, "geoms", [g])
    return unary_union([Polygon(p.exterior) for p in parts])

def to_svg(g, vb):
    def ring(c): return "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in c.coords) + "Z"
    d = "".join(ring(p.exterior) for p in getattr(g, "geoms", [g]))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><path d="{d}"/></svg>'

def main():
    designs = json.loads((ROOT / "src/lib/paper-themes.json").read_text())
    corners = sorted({d["compose"]["corner"] for d in designs if d.get("compose")})
    from shapely import affinity
    for c in corners:
        folder, name = c.split("/")
        # the other three corners are the top-left drawing mirrored inside their
        # SVGs (a transform this reader does not apply), so the halo is drawn
        # from the top-left one and mirrored here, the same way
        src = ROOT / "public/art" / folder / f"{name}-tl.svg"
        text = src.read_text()
        if "transform" in text:
            raise SystemExit(f"{src}: unexpected transform in the top-left drawing")
        vb = re.search(r'viewBox="([^"]+)"', text).group(1)
        x0, y0, W, H = map(float, vb.split())
        g = shapes(text)
        halo = fill(g.buffer(W * MARGIN, 24)).buffer(W * SMOOTH, 24).buffer(-W * SMOOTH, 24).simplify(0.4)
        cx, cy = x0 + W / 2, y0 + H / 2
        for k, (sx, sy) in {"tl": (1, 1), "tr": (-1, 1), "bl": (1, -1), "br": (-1, -1)}.items():
            m = affinity.scale(halo, sx, sy, origin=(cx, cy))
            (src.parent / f"{name}-halo-{k}.svg").write_text(to_svg(m, vb))
        print("halo", c)

if __name__ == "__main__":
    main()

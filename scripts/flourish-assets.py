"""
Build the invitation's ornaments from the couple's vintage flourish pack.

Source: `design/vintage-flourish/76795.eps` (rawpixel vintage flourish ornament
frame set — one sheet of 17 gold ornaments). The EPS paints every ornament as a
gradient rectangle clipped to the ornament's outline, so this script keeps the
outlines exactly as drawn (the clip paths), throws away the clipping
rectangles and the baked-in gradient, and writes each ornament as its own
clean SVG filled with the invitation's foil gradient.

Nothing is redrawn. Corners are the pack's own corners turned to face the
right way; the only "derived" pieces are cut out of a pack ornament (the end
scroll of the long rule) or are a pack ornament in flat colours (the seal).

    gs -dEPSCrop -sDEVICE=pdfwrite -o src.pdf 76795.eps
    inkscape src.pdf --pdf-poppler --export-plain-svg --export-filename=src.svg
    python3 scripts/flourish-assets.py src.svg public/kit/flourish

usage: flourish-assets.py <converted.svg> <outdir>
"""
import os
import re
import sys
import xml.etree.ElementTree as ET

NS = "{http://www.w3.org/2000/svg}"
SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
NUM = re.compile(r"-?\d*\.?\d+(?:e-?\d+)?")
TOK = re.compile(r"[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?")

# ── 1. the outlines, out of their clip paths ─────────────────────────────────
root = ET.parse(SRC).getroot()
clips = {c.get("id"): c for c in root.find(NS + "defs").findall(NS + "clipPath")}


def is_box(d):
    cmds = re.findall(r"[A-Za-z]", d)
    return "C" not in cmds and "c" not in cmds and len(cmds) <= 6


def bbox_of(d):
    v = list(map(float, NUM.findall(d)))
    return [min(v[0::2]), min(v[1::2]), max(v[0::2]), max(v[1::2])]


shapes = []
for g in [c for c in root if c.tag == NS + "g"]:
    chain, e = [], g
    while e is not None and e.tag == NS + "g":
        if e.get("clip-path"):
            chain.append(e.get("clip-path")[5:-1])
        kids = [k for k in e if k.tag == NS + "g"]
        e = kids[0] if kids else None
    parts = [(p.get("d"), p.get("clip-rule", "nonzero"))
             for cid in chain for p in clips[cid].findall(NS + "path") if not is_box(p.get("d"))]
    if not parts:
        parts = [(p.get("d"), p.get("clip-rule", "nonzero")) for p in clips[chain[-1]].findall(NS + "path")]
    shapes += [{"d": d, "rule": r, "bbox": bbox_of(d)} for d, r in parts]

# ── 2. group touching outlines into ornaments ───────────────────────────────
parent = list(range(len(shapes)))


def find(i):
    while parent[i] != i:
        parent[i] = parent[parent[i]]
        i = parent[i]
    return i


for i, a in enumerate(shapes):
    for j in range(i + 1, len(shapes)):
        b = shapes[j]
        A, B = a["bbox"], b["bbox"]
        if A[0] - 4 <= B[2] and B[0] - 4 <= A[2] and A[1] - 4 <= B[3] and B[1] - 4 <= A[3]:
            parent[find(i)] = find(j)
groups = {}
for i in range(len(shapes)):
    groups.setdefault(find(i), []).append(shapes[i])
orns = []
for members in groups.values():
    bb = [min(s["bbox"][0] for s in members), min(s["bbox"][1] for s in members),
          max(s["bbox"][2] for s in members), max(s["bbox"][3] for s in members)]
    orns.append({"bbox": bb, "shapes": members})
orns.sort(key=lambda o: (round(o["bbox"][1] / 60), o["bbox"][0]))
assert len(orns) == 17, f"expected the pack's 17 ornaments, found {len(orns)}"


# ── 3. write ─────────────────────────────────────────────────────────────────
def transform(d, fx, fy, prec):
    """Absolute-command path through (x, y) -> (fx(x), fy(y))."""
    out, cmd, k = [], None, 0
    for tok in TOK.findall(d):
        if tok.isalpha():
            cmd, k = tok, 0
            out.append(tok)
            continue
        v = float(tok)
        if cmd in "MLCSQT":
            v = fx(v) if k % 2 == 0 else fy(v)
        elif cmd == "H":
            v = fx(v)
        elif cmd == "V":
            v = fy(v)
        s = f"{v:.{prec}f}".rstrip("0").rstrip(".")
        out.append("0" if s in ("-0", "") else s)
        k += 1
    return re.sub(r" ?([A-Za-z]) ?", r"\1", " ".join(out))


# The invitation's foil: the theme's antique-gold ramp (--gold-1 … --gold-3,
# with a champagne catchlight), kept dark enough to hold on ivory paper.
FOIL = [("0", "#7d6236"), (".22", "#b8955c"), (".42", "#dcc28f"), (".6", "#b8955c"), (".82", "#7d6236"), ("1", "#a8874e")]


def write(name, members, bb, flip_x=False, flip_y=False, fill=None, pad=1.0):
    x0, y0, x1, y1 = bb
    w, h = x1 - x0 + 2 * pad, y1 - y0 + 2 * pad
    prec = 1 if max(w, h) > 200 else 2
    fx = (lambda x: x1 + pad - x) if flip_x else (lambda x: x - x0 + pad)
    fy = (lambda y: y1 + pad - y) if flip_y else (lambda y: y - y0 + pad)
    paths = "".join(
        f'<path{" fill-rule=" + chr(34) + "evenodd" + chr(34) if s["rule"] == "evenodd" else ""} d="{transform(s["d"], fx, fy, prec)}"/>'
        for s in members)
    if fill is None:
        stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in FOIL)
        defs = (f'<defs><linearGradient id="f" gradientUnits="userSpaceOnUse" x1="0" y1="0" '
                f'x2="{w:.0f}" y2="{h * 0.35:.0f}">{stops}</linearGradient></defs>')
        paint = 'fill="url(#f)"'
    else:
        defs, paint = "", f'fill="{fill}"'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" aria-hidden="true">'
           f'{defs}<g {paint}>{paths}</g></svg>')
    with open(f"{OUT}/{name}.svg", "w") as f:
        f.write(svg)
    print(f"{name:18s} {w:6.0f} x {h:<5.0f} {len(svg) / 1024:5.1f} KB")


# Which ornament on the sheet becomes what (indices in reading order).
USE = {
    0: "sprig-tulip",
    1: "crest",          # the heart-loop crest across the top of the sheet
    2: "sprig-lily",
    3: "rule",           # long rule with the heart medallion and scrolled ends
    4: "scroll-diamond",
    5: "scroll-bow",
    6: "wing",
    7: "scroll-twin",
    8: "scroll-knot",
    9: "fleuron",
    11: "star-rule",
    13: "rosette-a",
    14: "rosette-b",
    15: "rosette-c",
    16: "rosette-d",
}
for i, name in USE.items():
    write(name, orns[i]["shapes"], orns[i]["bbox"])

# Corners: the sheet draws them as a bottom-right (acanthus) and a bottom-left
# (looped) corner. The frame wants the top-left one and mirrors it to the rest.
write("corner", orns[12]["shapes"], orns[12]["bbox"], flip_x=True, flip_y=True)
write("corner-loop", orns[10]["shapes"], orns[10]["bbox"], flip_y=True)

# The scrolled end of the long rule, on its own: the tip the monogram's line
# runs out of.
rule = orns[3]
rx0, _, rx1, _ = rule["bbox"]
tip = [s for s in rule["shapes"] if s["bbox"][2] < rx0 + (rx1 - rx0) * 0.14]
tb = [min(s["bbox"][0] for s in tip), min(s["bbox"][1] for s in tip),
      max(s["bbox"][2] for s in tip), max(s["bbox"][3] for s in tip)]
write("rule-end", tip, tb)

# The medallion at the centre of the long rule, on its own: the small crest
# for tight places (the envelope flap, the join between the corners).
cx = (rx0 + rx1) / 2
mid = [s for s in rule["shapes"] if abs((s["bbox"][0] + s["bbox"][2]) / 2 - cx) < (rx1 - rx0) * 0.12
       and (s["bbox"][2] - s["bbox"][0]) < (rx1 - rx0) * 0.3]
mb = [min(s["bbox"][0] for s in mid), min(s["bbox"][1] for s in mid),
      max(s["bbox"][2] for s in mid), max(s["bbox"][3] for s in mid)]
write("medallion", mid, mb)

# The wax seal's stamp: rosette C, which survives being pressed small. Three
# flat inks — the lit lip, the shadow and the wax — so the seal can deboss it.
for tone, ink in (("light", "#fff4d8"), ("dark", "#3d2a12"), ("wax", "#a9874f")):
    write(f"seal-{tone}", orns[15]["shapes"], orns[15]["bbox"], fill=ink)

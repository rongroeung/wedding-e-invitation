"""
The thirty paper designs, as data: three collections of ten, each design a
composition (which pieces, where, printed how), a frame and a paper. Writes
src/lib/paper-themes.json, which lib/paperThemes turns into CSS.

No lotus in any design. The Khmer designs are contemporary interpretations
of motifs and structures seen in Angkorean ornament and architecture; they
are not presented as copies of specific historical works.

usage: python3 scripts/paper-designs.py
"""
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def P(src, corner, size, plate=None, **k):
    d = {"src": src, "corner": corner, "size": size}
    if plate:
        d["plate"] = plate
    d.update(k)
    return d


def B(src, k, plate, gap=None):
    d = {"src": src, "k": k, "plate": plate}
    if gap is not None:
        d["gap"] = gap
    return d


# ── papers and inks, one small palette per collection ─────────────────────
IVORY = dict(base="#f8f2e7", shade="#e9ddc8", light="rgb(255 253 246 / 0.9)", metal=["#8a693d", "#bf9d66", "#e6d2a6", "#a5834f"],
             ink="#4a3527", line="#6e5341")
CREAM = dict(base="#f5ecdc", shade="#e5d6bc", light="rgb(255 250 238 / 0.9)", metal=["#86643a", "#bb9760", "#e5cf9c", "#9e7b47"],
             ink="#47311f", line="#765536")
SAND = dict(base="#f1e7d6", shade="#dfd0b6", light="rgb(255 249 236 / 0.85)", metal=["#86653c", "#b99862", "#e2cc9a", "#9c7b49"],
            ink="#45311f", line="#7a6450")
SAND_DEEP = dict(base="#ece0c9", shade="#d8c6a6", light="rgb(255 247 230 / 0.8)", metal=["#86653c", "#bd9b62", "#e8d29f", "#a07d47"],
                 ink="#43301f", line="#75604a")
BLUSH = dict(base="#faf3ec", shade="#ecdccd", light="rgb(255 252 248 / 0.9)", metal=["#8c6c45", "#c2a16f", "#e8d4ab", "#a8875a"],
             ink="#4b3128", line="#6c4d40")
CHAMPAGNE = dict(base="#f1e5cf", shade="#ddcaa8", light="rgb(255 249 236 / 0.85)", metal=["#86643a", "#bb9760", "#e5cf9c", "#9e7b47"],
                 ink="#47321f", line="#7d5d38")
WASH = dict(petal="#e2b9ae", heart="#e3c487", leaf="#a8b39a")
WASH_TEAL = dict(petal="#e4b3ad", heart="#e8c78c", leaf="#97aea4")

GRAND = "min(30%, 16dvh, 210px)"
DESIGNS = [
    # ── A · ក្បាច់រចនាបុរាណខ្មែរ — Traditional Khmer ornament ───────────
    ("khmer-classical-flourish", "khmer", "ក្បាច់វល្លិខ្មែរបុរាណ", "Khmer Classical Flourish", IVORY, WASH, 0.95, 0.4, dict(
        art=[P("collection/naga-crest", "tc", "crest"), P("collection/kbach-medallion", "bc", "min(30%, 18dvh, 210px)")],
        corner="stationery/corner-acanthus", rule="double", lineMetal=True)),
    ("intricate-scrollwork", "khmer", "ក្បាច់វល្លិល្អិតល្អន់", "Intricate Khmer Scrollwork", CREAM, WASH, 0.95, 0.4, dict(
        art=[], corner="stationery/corner-loop", rule="double", lineMetal=True,
        bands={"t": B("collection/band-scroll", 0.36, "foil"), "b": B("collection/band-scroll", 0.36, "foil")})),
    ("royal-ornament", "khmer", "ក្បាច់រាជស៊ីមេទ្រី", "Symmetrical Royal Ornament", CREAM, WASH, 0.95, 0.4, dict(
        art=[P("collection/kbach-crest", "tc", "crest"), P("collection/kbach-medallion", "bc", "min(30%, 18dvh, 210px)")],
        corner="collection/corner-phka", rule="double", lineMetal=True)),
    ("classic-ivory", "khmer", "ក្បាច់វល្លិ និងមែកផ្កា", "Flowing Botanical Ornament", IVORY, WASH, 0.92, 0.42, dict(
        art=[P("collection/camellia-spray", "bl", "a"), P("collection/branch-hang", "tr", "b")],
        corner="stationery/corner-acanthus", rule="double", lineMetal=False)),
    ("fine-line-heritage", "khmer", "លំនាំបន្ទាត់ស្ដើងបេតិកភណ្ឌ", "Fine-Line Heritage Pattern", IVORY, WASH, 0.9, 0.4, dict(
        art=[], corner="collection/corner-single-phka", rule="single", lineMetal=True,
        pattern={"src": "collection/tile-diaper", "size": "clamp(52px, 9vmin, 84px)", "plate": "foil", "alpha": 0.42, "quiet": 0.06})),
    ("vintage-gold", "khmer", "ជ្រុងក្បាច់ដ៏វិចិត្រ", "Ornamental Corner Masterpiece", CREAM, WASH, 0.95, 0.3, dict(
        art=[], corner="stationery/corner-acanthus", cornerW=GRAND, rule="double", mid=True, lineMetal=True)),
    ("continuous-border", "khmer", "ស៊ុមក្បាច់បន្តជាប់", "Continuous Ornamental Border", IVORY, WASH, 0.95, 0.4, dict(
        art=[], corner="collection/corner-phka", rule="double", lineMetal=True,
        bands={"t": B("collection/band-scroll", 0.3, "foil"), "b": B("collection/band-scroll", 0.3, "foil"),
               "l": B("collection/band-scroll-v", 0.3, "foil"), "r": B("collection/band-scroll-v", 0.3, "foil")})),
    ("engraved-antique", "khmer", "ក្បាច់ឆ្លាក់បុរាណ", "Engraved Antique Ornament", IVORY, WASH, 0.9, 0.4, dict(
        art=[P("collection/engraved-corner", c, "min(34%, 21dvh, 230px)") for c in ("tl", "tr", "bl", "br")]
            + [P("collection/engraved-crest", "tc", "crest")],
        corner="collection/corner-plain-single", rule="single", lineMetal=False)),
    ("contemporary-khmer", "khmer", "បេតិកភណ្ឌខ្មែរសម័យថ្មី", "Contemporary Khmer Heritage", IVORY, WASH, 0.95, 0.4, dict(
        art=[P("collection/naga-crest", "tc", "min(34%, 20dvh, 230px)"), P("collection/mark-phka", "bc", "mark")],
        corner="collection/corner-single-phka", rule="single", lineMetal=True)),
    ("grand-ceremonial", "khmer", "ក្បាច់ពិធីដ៏អធិកអធម", "Grand Ceremonial Ornament", CREAM, WASH, 0.95, 0.4, dict(
        art=[P("collection/kbach-crest", "tc", "crest")], corner="stationery/corner-acanthus", cornerW=GRAND, rule="double",
        lineMetal=True, bands={"b": B("collection/band-garland", 0.46, "foil", 0.02)})),

    # ── B · ក្បាច់ចម្លាក់បុរាណខ្មែរ — Khmer sculpture & relief ───────────
    ("sandstone-relief", "relief", "ចម្លាក់ថ្មភក់", "Sandstone Relief", SAND, WASH, 0.9, 0.3, dict(
        art=[], corner="collection/corner-plain-single", rule="single", lineMetal=False,
        pattern={"src": "collection/tile-diaper", "size": "clamp(60px, 11vmin, 96px)", "plate": "relief", "alpha": 1, "quiet": 0.0})),
    ("architectural-border", "relief", "ស៊ុមចម្លាក់ស្ថាបត្យកម្ម", "Architectural Carved Border", SAND, WASH, 0.9, 0.3, dict(
        art=[], corner="collection/corner-plain-double", rule="double", lineMetal=False, depth="deep",
        bands={"t": B("collection/band-balusters", 0.5, "relief", 0.03), "b": B("collection/band-balusters", 0.5, "relief", 0.03),
               "l": B("collection/band-colonnette-v", 0.2, "relief"), "r": B("collection/band-colonnette-v", 0.2, "relief")})),
    ("layered-stone", "relief", "ក្បាច់ថ្មស្រទាប់", "Layered Stone Ornament", SAND, WASH, 0.9, 0.3, dict(
        art=[P("collection/kbach-crest", "tc", "crest", "relief"), P("collection/kbach-medallion", "bc", "min(30%, 18dvh, 210px)", "relief")],
        corner="collection/corner-plain-double", rule="double", lineMetal=False, depth="deep",
        bands={"l": B("collection/band-scroll-v", 0.3, "blind"), "r": B("collection/band-scroll-v", 0.3, "blind")})),
    ("floral-stone", "relief", "ចម្លាក់ផ្កាលើថ្ម", "Floral Stone Carving", SAND, WASH, 0.9, 0.3, dict(
        art=[P("collection/camellia-spray", "bl", "a", "relief"), P("collection/branch-hang", "tr", "b", "relief")],
        corner="collection/corner-plain-single", rule="single", lineMetal=False)),
    ("architectural-panels", "relief", "ផ្ទាំងចម្លាក់ស្ថាបត្យកម្ម", "Classical Architectural Panels", SAND_DEEP, WASH, 0.9, 0.3, dict(
        art=[], corner="collection/corner-plain-double", rule="double", lineMetal=False,
        bands={"t": B("collection/band-lozenge", 0.55, "relief", 0.03), "b": B("collection/band-lozenge", 0.55, "relief", 0.03)})),
    ("sculpted-scrollwork", "relief", "ក្បាច់វល្លិចម្លាក់", "Sculpted Scrollwork", SAND, WASH, 0.9, 0.3, dict(
        art=[P("collection/pack-scroll-bow", "tc", "crest", "relief"), P("collection/pack-scroll-bow", "bc", "crest", "relief")]
            + [P("collection/pack-acanthus", c, "min(26%, 17dvh, 180px)", "relief") for c in ("tl", "tr", "bl", "br")],
        corner="collection/corner-plain-double", rule="double", lineMetal=False, depth="deep")),
    ("recessed-frame", "relief", "ស៊ុមចម្លាក់ផត", "Recessed Relief Frame", IVORY, WASH, 0.9, 0.3, dict(
        art=[P("collection/mark-phka", c, "mark", "relief") for c in ("tl", "tr", "bl", "br")], recess=True,
        corner="collection/corner-plain-single", rule="single", lineMetal=False)),
    ("heritage-engraving", "relief", "ចម្លាក់បេតិកភណ្ឌ", "Heritage Engraving", IVORY, WASH, 0.9, 0.3, dict(
        art=[], corner="collection/corner-single-phka", rule="single", lineMetal=False,
        bands={"t": B("collection/band-garland", 0.44, "line", 0.02), "b": B("collection/band-garland", 0.44, "line", 0.02)})),
    ("stone-and-gold", "relief", "ថ្ម និងមាស", "Stone-and-Gold Elegance", SAND_DEEP, WASH, 0.95, 0.3, dict(
        art=[P("collection/kbach-medallion", "tc", "min(32%, 18dvh, 220px)")], corner="stationery/corner-acanthus", rule="double",
        lineMetal=True, bands={"b": B("collection/band-garland", 0.44, "foil", 0.02)},
        pattern={"src": "collection/tile-diaper", "size": "clamp(60px, 11vmin, 96px)", "plate": "relief", "alpha": 1, "quiet": 0.0})),
    ("grand-relief", "relief", "ចម្លាក់ធំអធិកអធម", "Grand Khmer Relief Composition", SAND, WASH, 0.95, 0.3, dict(
        art=[P("collection/arch", "tc", "min(70%, 40dvh, 540px)", "relief")], corner="collection/corner-plain-double", rule="double", lineMetal=False,
        depth="deep", bands={"b": B("collection/band-balusters", 0.5, "relief", 0.03),
                             "l": B("collection/band-colonnette-v", 0.2, "relief"), "r": B("collection/band-colonnette-v", 0.2, "relief")})),

    # ── C · ក្បាច់ផ្កា និងរុក្ខជាតិ — Floral & botanical ──────────────────
    ("vintage-rose", "floral", "ផ្កាកុលាបឆ្លាក់បុរាណ", "Vintage Rose Engraving", IVORY, WASH, 0.9, 0.42, dict(
        art=[P("collection/rose-spray", "bl", "a"), P("collection/rose-single", "tr", "c")],
        corner="collection/corner-single-sprig", rule="single", lineMetal=False)),
    ("camellia-elegance", "floral", "ផ្កាកាមេលៀ", "Camellia Elegance", IVORY, WASH, 0.9, 0.45, dict(
        art=[P("collection/camellia-spray", "bl", "a"), P("collection/camellia-single", "tr", "c")],
        corner="stationery/corner-floral", rule="double", lineMetal=False)),
    ("floral-branches", "floral", "មែកផ្ការីក", "Flowering Branches", BLUSH, WASH_TEAL, 0.88, 0.5, dict(
        art=[P("collection/branch-hang", "tr", "a"), P("collection/branch-hang", "bl", "a")],
        corner="collection/corner-single-sprig", rule="single", lineMetal=False)),
    ("ornamental-garden", "floral", "សួនផ្ការចនា", "Ornamental Garden", IVORY, WASH, 0.9, 0.5, dict(
        art=[P("collection/garden-corner", "bl", "a"), P("collection/rose-single", "tr", "c")],
        corner="stationery/corner-floral", rule="double", lineMetal=False)),
    ("botanical-engraving", "floral", "រុក្ខជាតិឆ្លាក់ល្អិត", "Fine Botanical Engraving", IVORY, WASH, 0.9, 0.0, dict(
        art=[P("collection/rose-single", "bl", "c"), P("collection/camellia-single", "br", "c"), P("collection/branch-hang", "tr", "c")],
        corner="collection/corner-plain-single", rule="single", lineMetal=False)),
    ("floral-corners", "floral", "ជ្រុងផ្កាដ៏វិចិត្រ", "Floral Corner Masterpiece", IVORY, WASH, 0.9, 0.45, dict(
        art=[P("collection/camellia-spray", "bl", "b"), P("collection/camellia-spray", "br", "b"),
             P("collection/branch-hang", "tl", "c"), P("collection/branch-hang", "tr", "c")],
        corner="stationery/corner-floral", rule="double", lineMetal=False)),
    ("flowering-vine", "floral", "វល្លិផ្ការ៉ូមែនទិក", "Romantic Flowering Vine", BLUSH, WASH, 0.9, 0.45, dict(
        art=[P("collection/camellia-single", "bl", "c"), P("collection/camellia-single", "tr", "c")],
        corner="collection/corner-plain-single", rule="single", lineMetal=False,
        bands={"l": B("collection/band-vine-v", 0.4, "line"), "r": B("collection/band-vine-v", 0.4, "line")})),
    ("antique-floral-frame", "floral", "ស៊ុមផ្កាបុរាណ", "Antique Floral Frame", CREAM, WASH, 0.9, 0.4, dict(
        art=[], corner="stationery/corner-loop", rule="double", lineMetal=False,
        bands={"t": B("collection/band-vine", 0.42, "foil"), "b": B("collection/band-vine", 0.42, "foil")})),
    ("champagne-botanical", "floral", "សួនរុក្ខជាតិពណ៌សំប៉ាញ", "Champagne Botanical Garden", CHAMPAGNE, dict(petal="#d6b399", heart="#d8b878", leaf="#b9ae8b"),
     0.92, 0.14, dict(
        art=[P("collection/camellia-spray", "bl", "a"), P("collection/branch-hang", "tr", "b"), P("collection/camellia-single", "br", "c", "blind")],
        corner="stationery/corner-acanthus", rule="double", lineMetal=True)),
    ("grand-floral", "floral", "សមាសភាពផ្កាដ៏អធិកអធម", "Grand Floral Composition", IVORY, WASH, 0.9, 0.45, dict(
        art=[P("collection/garden-head", "tc", "wide")], corner="stationery/corner-floral", rule="double", lineMetal=False,
        bands={"b": B("collection/band-vine", 0.42, "line", 0.02)})),
]

out = []
for key, group, km, en, paper, wash, foil, bloom, compose in DESIGNS:
    d = {"key": key, "km": km, "en": en, "group": group, "pattern": "none", "dark": False, **paper, **wash,
         "size": 460, "foil": foil, "bloom": bloom, "relief": 0, "fibre": 0.42, "centre": 0, "kline": 0,
         "lineAlpha": 0.92 if compose.get("lineMetal") or bloom == 0 else 0.76, "compose": compose}
    out.append(d)
assert len(out) == 30 and len({d["key"] for d in out}) == 30
for g in ("khmer", "relief", "floral"):
    assert sum(1 for d in out if d["group"] == g) == 10
with open(os.path.join(ROOT, "src", "lib", "paper-themes.json"), "w") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
print(len(out), "designs")

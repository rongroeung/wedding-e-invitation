"""
The Khmer typefaces the couple can set their invitation in (ពុម្ពអក្សរ).

Bundles every face so each guest sees the same type whatever their device:
the Google Fonts Khmer families (SIL OFL 1.1, from the @fontsource npm
packages, Khmer and Latin subsets, regular and bold where the family has a
bold) and the Khmer OS family (LGPL-2.1+, Danh Hong / Open Forum of Cambodia,
from the Debian/Ubuntu `fonts-khmeros` packages, converted to WOFF2 with no
change to glyphs or metrics).

Writes:
  public/fonts/khmer/*.woff2
  public/fonts/khmer/khmer-fonts.css   @font-face for every face not already
                                       declared elsewhere (font-display: swap;
                                       a browser downloads only the faces a
                                       page actually uses)
  src/lib/khmer-fonts.json             the picker's list: family, its role
                                       (heading or text), and a note

usage: python3 scripts/khmer-fonts.py <fontsource dir> <khmeros ttf dir>
"""
import json
import os
import sys

from fontTools.ttLib import TTFont

FS, KOS = sys.argv[1], sys.argv[2]
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "public", "fonts", "khmer")
os.makedirs(OUT, exist_ok=True)

KHMER_RANGE = "U+1780-17FF, U+19E0-19FF, U+200C-200D, U+25CC"
LATIN_RANGE = ("U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, "
               "U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD")

# family, role, note (Khmer), and where it comes from
# role: "heading" — ceremonial / display; "text" — for reading
FONTS = [
    # already in the app (kept in the list)
    ("Khmer OS Muol Light", "heading", "អក្សរមូលស្រាល — ប្រពៃណីសម្រាប់ចំណងជើងពិធី", "present"),
    ("Moul", "heading", "អក្សរមូល — ក្រាស់ ឧឡារិក", "present"),
    ("Noto Serif Khmer", "text", "អក្សរមានជើង — ស្អាតអានងាយ", "present"),
    ("Noto Sans Khmer", "text", "អក្សរគ្មានជើង — ទំនើប ច្បាស់", "present"),
    ("Kantumruy Pro", "text", "អក្សរទំនើប — ស្ដើង ស្អាត", "present"),
    # Google Fonts families already declared for the monogram
    ("Moulpali", "heading", "អក្សរមូលបាលី — ឧឡារិក", "present"),
    ("Koulen", "heading", "អក្សរគូលេន — ក្រាស់ ទំនើប", "present"),
    ("Bokor", "heading", "អក្សរបូកគោ — ស្ទីលបុរាណ", "present"),
    ("Taprom", "heading", "អក្សរតាព្រហ្ម — ក្បាច់ស្រស់", "present"),
    ("Fasthand", "heading", "អក្សរដៃ — សរសេររហ័ស", "present"),
    ("Odor Mean Chey", "heading", "អក្សរឧត្តរមានជ័យ", "present"),
    ("Preahvihear", "heading", "អក្សរព្រះវិហារ", "present"),
    ("Suwannaphum", "text", "អក្សរសុវណ្ណភូមិ — មានជើងស្រទន់", "present"),
    ("Hanuman", "text", "អក្សរហនុមាន — មានជើង អានស្រួល", "present"),
    # Google Fonts families, newly bundled
    ("Angkor", "heading", "អក្សរអង្គរ — ចំណងជើងក្រាស់", "fontsource:angkor"),
    ("Bayon", "heading", "អក្សរបាយ័ន — ស្ទីលចំណងជើង", "fontsource:bayon"),
    ("Chenla", "heading", "អក្សរចេនឡា", "fontsource:chenla"),
    ("Dangrek", "heading", "អក្សរដងរែក — ក្រាស់ រឹងមាំ", "fontsource:dangrek"),
    ("Freehand", "heading", "អក្សរសរសេរដៃ — សេរី ស្រទន់", "fontsource:freehand"),
    ("Metal", "heading", "អក្សរមេតាល់ — ស្ទីលពិសេស", "fontsource:metal"),
    ("Kdam Thmor Pro", "heading", "អក្សរក្ដាមថ្ម — ទំនើប ក្រាស់", "fontsource:kdam-thmor-pro"),
    ("Battambang", "text", "អក្សរបាត់ដំបង — ពេញនិយមសម្រាប់អត្ថបទ", "fontsource:battambang"),
    ("Content", "text", "អក្សរខនថេន — អត្ថបទទូទៅ", "fontsource:content"),
    ("Khmer", "text", "អក្សរខ្មែរ — សាមញ្ញ ច្បាស់", "fontsource:khmer"),
    ("Koh Santepheap", "text", "អក្សរកោះសន្តិភាព — មានជើង", "fontsource:koh-santepheap"),
    ("Nokora", "text", "អក្សរនគរ — ទំនើប ស្អាត", "fontsource:nokora"),
    ("Siemreap", "text", "អក្សរសៀមរាប — អត្ថបទទូទៅ", "fontsource:siemreap"),
    # the Khmer OS family (the faces most Cambodian documents are set in)
    ("Khmer OS", "text", "Khmer OS — ស្តង់ដារ ពេញនិយមបំផុត", "kos:KhmerOS.ttf"),
    ("Khmer OS System", "text", "Khmer OS System — សម្រាប់អត្ថបទ", "kos:KhmerOSsys.ttf"),
    ("Khmer OS Battambang", "text", "Khmer OS Battambang — អត្ថបទ ពេញនិយម", "kos:KhmerOSbattambang.ttf"),
    ("Khmer OS Siemreap", "text", "Khmer OS Siemreap — អត្ថបទ ពេញនិយម", "kos:KhmerOSsiemreap.ttf"),
    ("Khmer OS Content", "text", "Khmer OS Content — អត្ថបទ", "kos:KhmerOScontent.ttf"),
    ("Khmer OS Muol", "heading", "Khmer OS Muol — មូលក្រាស់ ប្រពៃណី", "kos:KhmerOSmuol.ttf"),
    ("Khmer OS Muol Pali", "heading", "Khmer OS Muol Pali — មូលបាលី", "kos:KhmerOSmuolpali.ttf"),
    ("Khmer OS Bokor", "heading", "Khmer OS Bokor — ស្ទីលបុរាណ", "kos:KhmerOSbokor.ttf"),
    ("Khmer OS Fasthand", "heading", "Khmer OS Fasthand — សរសេរដៃ", "kos:KhmerOSfasthand.ttf"),
    ("Khmer OS Freehand", "heading", "Khmer OS Freehand — សរសេរដៃសេរី", "kos:KhmerOSfreehand.ttf"),
    ("Khmer OS Metal Chrieng", "heading", "Khmer OS Metal Chrieng — ទ្រេត ស្រស់", "kos:KhmerOSmetalchrieng.ttf"),
]


def face(family, weight, url, rng):
    return (f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};font-display:swap;"
            f"src:url({url}) format('woff2');unicode-range:{rng};}}")


css = ["/* Khmer typefaces for the invitation (scripts/khmer-fonts.py). SIL OFL 1.1"
       " (Google Fonts families) and LGPL-2.1+ (Khmer OS). */"]
listing = []
for family, role, note, src in FONTS:
    if src.startswith("fontsource:"):
        pkg = src.split(":")[1]
        files = os.path.join(FS, pkg, "package", "files")
        for weight in (400, 700):
            for subset, rng in (("khmer", KHMER_RANGE), ("latin", LATIN_RANGE)):
                name = f"{pkg}-{subset}-{weight}-normal.woff2"
                p = os.path.join(files, name)
                if os.path.exists(p):
                    with open(p, "rb") as fi, open(os.path.join(OUT, name), "wb") as fo:
                        fo.write(fi.read())
                    css.append(face(family, weight, f"/fonts/khmer/{name}", rng))
    elif src.startswith("kos:"):
        ttf = src.split(":")[1]
        name = ttf.replace(".ttf", ".woff2")
        f = TTFont(os.path.join(KOS, ttf))
        f.flavor = "woff2"
        f.save(os.path.join(OUT, name))
        css.append(f"@font-face{{font-family:'{family}';font-style:normal;font-weight:400;font-display:swap;"
                   f"src:url(/fonts/khmer/{name}) format('woff2');}}")
    listing.append({"family": family, "role": role, "note": note,
                    "license": "LGPL-2.1+" if src.startswith("kos:") or family == "Khmer OS Muol Light" else "OFL-1.1"})

with open(os.path.join(OUT, "khmer-fonts.css"), "w") as fh:
    fh.write("\n".join(css) + "\n")
with open(os.path.join(ROOT, "src", "lib", "khmer-fonts.json"), "w") as fh:
    json.dump(listing, fh, ensure_ascii=False, indent=1)
print(len(listing), "fonts;", len(css) - 1, "faces declared")

"""
Restores real transparency to artwork whose "transparent" background was
flattened into a checkerboard.

The checker is two neutral greys; the gold ink is chromatic and, where it is
dark, far darker than either grey. Alpha therefore comes from chroma plus a
darkness term, the ornament's interior is filled so pale highlights are not
punched through, and the colour is un-premultiplied against the checker's mean.

    python3 scripts/dekey-checkerboard.py <in.png> <out.png>
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

CHECKER_LIGHT = 252.0
CHECKER_DARK = 221.0
CHECKER_MEAN = 236.0   # midpoint of the two greys
CHECKER_TOL = 8.0
CHROMA_FLOOR = 4.0     # below this is compression noise
CHROMA_FULL = 45.0     # chroma of solidly inked pixels
DARK_KNEE = 215.0      # darker than the dark square, so the checker scores zero
DARK_FULL = 60.0


def dekey(src: str, dst: str) -> None:
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)

    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    lum = rgb.mean(axis=2)

    alpha = np.clip((chroma - CHROMA_FLOOR) / (CHROMA_FULL - CHROMA_FLOOR), 0, 1)
    alpha = np.maximum(alpha, np.clip((DARK_KNEE - lum) / DARK_FULL, 0, 1))

    # A pixel that is neutral and sits on one of the two checker tones is
    # background, wherever it happens to be.
    checker = (chroma < CHECKER_TOL) & (
        (np.abs(lum - CHECKER_LIGHT) < CHECKER_TOL) | (np.abs(lum - CHECKER_DARK) < CHECKER_TOL)
    )

    # Pale highlights inside the ornament read as background on their own, so
    # close the outline and fill what it encloses — but never revive the
    # checker itself, or the gaps between the scrolls fill in solid.
    solid = ndimage.binary_closing(alpha > 0.4, structure=np.ones((3, 3)), iterations=2)
    filled = ndimage.binary_fill_holes(solid) & ~checker
    alpha = np.where(filled, 1.0, alpha)

    # Drop specks the fill did not catch (stray checker noise).
    labels, n = ndimage.label(alpha > 0.15)
    if n:
        sizes = ndimage.sum(np.ones_like(labels), labels, range(1, n + 1))
        keep = np.isin(labels, 1 + np.flatnonzero(sizes >= 24))
        alpha = np.where(keep, alpha, 0.0)

    a3 = alpha[:, :, None]
    with np.errstate(invalid="ignore", divide="ignore"):
        colour = np.where(
            a3 > 0.995,
            rgb,
            np.where(a3 > 0.01, (rgb - CHECKER_MEAN * (1 - a3)) / np.maximum(a3, 1e-6), rgb),
        )
    colour = np.clip(colour, 0, 255)

    out = np.dstack([colour, alpha * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst, optimize=True)
    print(f"{dst}: {out.shape[1]}x{out.shape[0]}  inked={(alpha > 0).mean() * 100:.1f}%")


if __name__ == "__main__":
    dekey(sys.argv[1], sys.argv[2])

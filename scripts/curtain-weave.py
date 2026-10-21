"""
A seamless woven tile: plain weave, warp vertical and weft horizontal, each
thread with its own thickness and slubs along its length (periodic, so the
tile repeats without a join). Neutral grey around exactly 128, for `overlay`:
mid-grey is the identity, so the weave adds thread relief without shifting the
cloth's tone.

usage: weave.py <out.webp> [size] [period] [strength]
"""
import sys
import numpy as np
from PIL import Image

out = sys.argv[1]
N = int(sys.argv[2]) if len(sys.argv) > 2 else 384
P = int(sys.argv[3]) if len(sys.argv) > 3 else 4        # thread pitch, px
K = float(sys.argv[4]) if len(sys.argv) > 4 else 15.0    # relief, grey levels
rng = np.random.default_rng(7)
assert N % (2 * P) == 0

def periodic_noise(n, cutoff, size):
    """1-D (per row) periodic low-frequency noise via FFT."""
    f = np.fft.rfftfreq(n) * n
    spec = (rng.normal(size=(size, f.size)) + 1j * rng.normal(size=(size, f.size))) * (f <= cutoff) * (f > 0)
    x = np.fft.irfft(spec, n=n, axis=1)
    return x / (x.std() + 1e-9)

T = N // P
yy, xx = np.mgrid[0:N, 0:N]
ci, cj = xx // P, yy // P                 # warp column, weft row
fx, fy = (xx % P + 0.5) / P, (yy % P + 0.5) / P
warp_over = ((ci + cj) % 4) < 2

# each warp thread varies along y, each weft along x; plus per-thread thickness
warp_slub = periodic_noise(N, 6, T)       # T threads × N samples along y
weft_slub = periodic_noise(N, 6, T)
warp_w = 1 + 0.12 * rng.normal(size=T)
weft_w = 1 + 0.12 * rng.normal(size=T)
wa = warp_slub[ci, yy] * 0.35 + (warp_w[ci] - 1) * 2
we = weft_slub[cj, xx] * 0.35 + (weft_w[cj] - 1) * 2

# a thread seen across its width is a rounded ridge; where it dips under its
# neighbour it is in shade
warp_h = np.sin(np.pi * fx) ** 0.8 * (0.55 + 0.45 * np.sin(np.pi * fy))
weft_h = np.sin(np.pi * fy) ** 0.8 * (0.55 + 0.45 * np.sin(np.pi * fx))
h = np.where(warp_over, warp_h * (1 + 0.25 * wa), weft_h * (1 + 0.25 * we) * 0.9)
# soft: a real weave is never a crisp checker at this scale
k = np.array([1, 2, 1]) / 4
for _ in range(1):
    h = (np.roll(h, 1, 0) * k[0] + h * k[1] + np.roll(h, -1, 0) * k[2])
    h = (np.roll(h, 1, 1) * k[0] + h * k[1] + np.roll(h, -1, 1) * k[2])
h = (h - h.mean()) / h.std()
g = np.clip(128 + K * h * 0.5, 0, 255)
g = g - (g.mean() - 128)
Image.fromarray(np.round(g).astype(np.uint8), "L").convert("RGB").save(out, quality=88, method=6)
print(out, N, P, K, "mean", round(float(g.mean()), 2))

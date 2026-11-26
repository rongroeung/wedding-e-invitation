"""One live paper: crop the panel, take the template lettering out of every
frame, and make a seamless loop.  usage: process.py <src.mp4> <key> <y0> <y1>"""
import sys, subprocess, numpy as np, cv2
src, key, fy0, fy1 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
fx0, fx1 = (float(sys.argv[5]), float(sys.argv[6])) if len(sys.argv) > 6 else (0.07, 0.93)
OUT = f"/home/claude/work/wedding-e-invitation/public/themes/{key}"
probe = subprocess.run(["ffmpeg", "-v", "error", "-ss", "1", "-i", src, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
g = np.frombuffer(probe, np.uint8).reshape(1080, 1920)
cols = np.where(g.mean(axis=0) > 8)[0]; x0, x1 = int(cols.min()), int(cols.max()); W = x1 - x0 + 1; W -= W % 2; H = 1080
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"crop={W}:{H}:{x0}:0", "-an", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
box = np.zeros((H, W), bool); box[int(H * fy0):int(H * fy1), int(W * fx0):int(W * fx1)] = True
# more areas, "y0,y1,x0,x1" each, for lettering in separate places (Theme 6)
for extra in sys.argv[7:]:
    a, b, c, d = map(float, extra.split(","))
    box[int(H * a):int(H * b), int(W * c):int(W * d)] = True

def dev(f):
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB).astype(np.float32)
    bg = cv2.medianBlur(cv2.cvtColor(f, cv2.COLOR_BGR2LAB), 41).astype(np.float32)
    return lab, np.linalg.norm(lab - bg, axis=2)

# the lettering's colour: what stands out most inside the box, on a few frames
samples = []
for f in fr[:: max(1, len(fr) // 6)]:
    lab, d = dev(f); d = np.where(box, d, 0)
    t = np.percentile(d[box], 97); samples.append(lab[(d >= t) & box])
ink = np.median(np.concatenate(samples), axis=0)

def textmask(f, loose=False):
    """How far each pixel has moved from its background towards the ink: the
    lettering's alpha. Solid strokes are near 1, a hairline's soft edge lower;
    the scenery around moves in other directions and is left alone."""
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB).astype(np.float32)
    bg = cv2.medianBlur(cv2.cvtColor(f, cv2.COLOR_BGR2LAB), 41).astype(np.float32)
    v = lab - bg
    u = ink[None, None, :] - bg
    uu = np.maximum((u * u).sum(axis=2), 64.0)
    alpha = (v * u).sum(axis=2) / uu
    perp = np.linalg.norm(v - alpha[:, :, None] * u, axis=2)
    a_min = 0.12 if loose else 0.35
    m = ((alpha > a_min) & (perp < 8 + 15 * np.clip(alpha, 0, 1)) & box).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    return cv2.dilate(m, np.ones((9, 9), np.uint8))

masks = [textmask(f) for f in fr]
out = np.empty_like(fr)
for i, f in enumerate(fr):
    m = masks[i] | masks[max(0, i - 1)] | masks[min(len(fr) - 1, i + 1)]
    c = cv2.inpaint(f, m, 9, cv2.INPAINT_TELEA)
    # a second look at the cleaned frame: the fine hairlines are paler than the
    # strokes and can slip past the first colour match; only near the lettering
    near_text = cv2.dilate(m, np.ones((15, 15), np.uint8))
    m2 = textmask(c, loose=True) & near_text
    if m2.any():
        c = cv2.inpaint(c, m2, 9, cv2.INPAINT_TELEA)
        m = m | m2
    feather = cv2.GaussianBlur(cv2.dilate(m, np.ones((21, 21), np.uint8)).astype(np.float32) / 255, (51, 51), 0)[:, :, None]
    out[i] = (c * (1 - feather) + cv2.GaussianBlur(c, (0, 0), 8) * feather).astype(np.uint8)
K = 30; N = len(out)
loop = out[: N - K].astype(np.float32)
for i in range(K):
    a = i / K; loop[i] = out[N - K + i] * (1 - a) + out[i] * a
loop = loop.astype(np.uint8)
enc = subprocess.run(["ffmpeg", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
    "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "27", "-preset", "slow", "-movflags", "+faststart", "-an",
    "-y", f"{OUT}/{key}-paper.mp4"], input=loop.tobytes())
cv2.imwrite(f"/tmp/claude-0/lbwork/{key}-poster.png", loop[0])
y0, y1 = int(H * fy0) - 20, int(H * fy1) + 20
cv2.imwrite(f"/tmp/claude-0/lbwork/{key}-check.png", np.vstack([np.hstack([fr[k][y0:y1] for k in (5, N // 2, N - 5)]), np.hstack([out[k][y0:y1] for k in (5, N // 2, N - 5)])]))
c = loop[:, int(H * fy0):int(H * fy1)].astype(np.int16)
print(key, "frames", len(loop), "ink", ink.round(), "centre change/frame %.2f" % np.abs(np.diff(c[::3], axis=0)).mean(), "seam %.2f" % np.abs(c[-1] - c[0]).mean())

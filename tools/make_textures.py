"""Rebuild Staša's print patterns (lips, lashed eyes, red eyes, hands) in high quality.

How it works
1. Every clean motif is cut out of a sample photo of her print (boxes below,
   in source pixels).
2. The samples are first enlarged 4x with an AI super-resolution model (EDSR, run
   locally with OpenCV). The *-x4.png files are saved next to the samples, so this
   only runs once. Each motif keeps its real printed tones (shading, highlights,
   single lashes); the paper and stray threads are removed.
3. The motifs are scattered at random positions, angles and sizes on a seamless
   tile, the way her printed fabric looks. Satin ribbons and fabric bands are added
   on top.

Samples live in images/textures/source/. With sharper photos of the same
fabrics, save them over these files, update the boxes and run:
    python3 tools/make_textures.py            (needs Pillow, numpy, scipy)
To redo the AI enlargement for a new sample, delete its *-x4.png and put the model
EDSR_x4.pb (github.com/Saafke/EDSR_Tensorflow/tree/master/models) in tools/,
then: pip install opencv-contrib-python-headless
Change SEED to get a new random arrangement.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "images", "textures", "source")
OUT = os.path.join(HERE, "..", "images", "textures")
SEED = 1972
UP = 6                                    # redraw motifs at 6x the sample size
COTTON = np.array([238, 233, 223.]); INK = np.array([22, 21, 22.]); RED = np.array([214, 52, 40.])
SATIN_RED = np.array([196, 20, 30.]); SATIN_WHITE = np.array([248, 247, 243.]); BAND = np.array([58, 60, 66.])

# ---------------- motif boxes (x0, y0, x1, y1) in source pixels ----------------
LIPS = [(160,100,193,125),(105,178,140,200),(162,178,197,207),(220,185,258,215),
        (163,237,198,260),(118,262,157,282),(167,272,207,292),(106,295,148,320),
        (157,302,190,328),(160,382,192,408),(219,388,258,418)]
EYES = [(2,26,48,54),(25,70,66,96),(77,44,119,74),(49,106,88,130),(96,96,130,124),(0,130,34,161)]
RED_EYES = [(117,230,157,260),(160,257,203,280),(118,280,157,307),(163,292,205,318),(152,332,200,360),
            (160,367,205,393),(203,405,245,433),(222,363,255,390),(217,440,255,467)]
HANDS = [(52,52,100,100),(58,3,97,30),(60,293,100,323),(120,167,157,213),(120,80,160,117)]

SR = 4
def load(name):
    """Return the 4x AI-enlarged sample (made once with EDSR, then cached)."""
    x4 = os.path.join(SRC, name.replace(".png", "-x4.png"))
    if not os.path.exists(x4):
        import cv2
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(os.path.join(HERE, "EDSR_x4.pb")); sr.setModel("edsr", SR)
        cv2.imwrite(x4, sr.upsample(cv2.imread(os.path.join(SRC, name), cv2.IMREAD_COLOR)))
    return np.asarray(Image.open(x4).convert("RGB")).astype(float)

def smooth(d, t, w=.07):
    x = np.clip((d - (t - w)) / (2 * w), 0, 1)
    return x * x * (3 - 2 * x)

def cut(img, box, mode, keep_t=.35, margin=4):
    """Cut one motif out of the enlarged sample, keeping its printed tones."""
    x0, y0, x1, y1 = [v * SR for v in box]; m = margin * SR
    x0, y0 = max(0, x0 - m), max(0, y0 - m); x1, y1 = min(img.shape[1], x1 + m), min(img.shape[0], y1 + m)
    crop = Image.fromarray(img[y0:y1, x0:x1].astype("uint8"))
    k = UP / SR
    big = np.asarray(crop.resize((round(crop.width * k), round(crop.height * k)), Image.LANCZOS)).astype(float)
    big = ndi.gaussian_filter(big, sigma=(.7, .7, 0))
    R, G, B = big[..., 0], big[..., 1], big[..., 2]
    if mode == "red":                                   # red ink: how much redder than the cream
        r = (R - G) - np.clip(B - G, 0, None) * .6
        d = np.clip((r - 24) / 78, 0, 1)
    else:                                               # black ink: how much darker than the cream
        L = .3 * R + .59 * G + .11 * B
        bg = np.percentile(L, 90); ink = min(np.percentile(L, 1.5), 60)
        d = np.clip((bg - 10 - L) / (bg - 10 - ink), 0, 1)
        d *= np.clip(1 - (B - R - 4) / 14, 0, 1)       # blue-grey sewing threads are not ink
    d = np.clip((d - .1) / .9 * 1.25, 0, 1) ** .85        # clean paper, deep ink, keep the half-tones
    # keep the motif and what is joined to it; drop neighbours cut by the box edge
    lab, n = ndi.label(d > keep_t)
    if n:
        h, w = d.shape
        sizes = ndi.sum(np.ones_like(d), lab, range(1, n + 1))
        main = int(np.argmax(sizes)) + 1
        near = ndi.binary_dilation(lab == main, iterations=int(UP * 2.2))
        keep = np.zeros(n + 1, bool); keep[main] = True
        for i, sl in enumerate(ndi.find_objects(lab), 1):
            if i == main: continue
            touches = sl[0].start == 0 or sl[1].start == 0 or sl[0].stop == h or sl[1].stop == w
            if (near & (lab == i)).any() and not touches and sizes[i - 1] > 12 * UP:
                keep[i] = True
        mask = ndi.binary_dilation(keep[lab], iterations=int(UP * .9))
        d = d * ndi.gaussian_filter(mask.astype(float), UP * .35)
    h, w = d.shape; f = UP * 2.5                          # nothing ever looks cut
    fy = np.clip(np.minimum(np.arange(h), h - 1 - np.arange(h)) / f, 0, 1)
    fx = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / f, 0, 1)
    d = d * np.minimum(fy[:, None], fx[None, :])
    ys, xs = np.where(d > .03)
    return d[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

def rotate(a, deg, scale, flip):
    im = Image.fromarray((a * 255).astype("uint8"))
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if scale != 1: im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    im = im.rotate(deg, resample=Image.BICUBIC, expand=True)
    return np.asarray(im).astype(float) / 255

def scatter(sprites, tw, th, count, min_gap, rot, scale=(.88, 1.12), flip=True, rng=None):
    """Random, non-overlapping placement on a seamless (wrap-around) tile."""
    canvas = np.zeros((th, tw)); placed = []
    tries = 0
    order = list(range(len(sprites)))
    while len(placed) < count and tries < count * 400:
        tries += 1
        s = sprites[order[len(placed) % len(order)] if tries % 3 else rng.integers(len(sprites))]
        sc = rng.uniform(*scale); r = max(s.shape) * sc * .5
        x, y = rng.uniform(0, tw), rng.uniform(0, th)
        ok = True
        for (px, py, pr) in placed:
            dx = min(abs(x - px), tw - abs(x - px)); dy = min(abs(y - py), th - abs(y - py))
            if (dx * dx + dy * dy) ** .5 < (r + pr) * min_gap: ok = False; break
        if not ok: continue
        a = rotate(s, rng.uniform(-rot, rot), sc, flip and rng.random() < .5)
        h, w = a.shape
        placed.append((x, y, r))
        x0, y0 = int(x - w / 2), int(y - h / 2)
        for ox in (-tw, 0, tw):
            for oy in (-th, 0, th):
                X, Y = x0 + ox, y0 + oy
                xs, ys = max(0, X), max(0, Y); xe, ye = min(tw, X + w), min(th, Y + h)
                if xe > xs and ye > ys:
                    canvas[ys:ye, xs:xe] = np.maximum(canvas[ys:ye, xs:xe], a[ys - Y:ye - Y, xs - X:xe - X])
    return canvas

def print_ink(alpha, colour, ground, rng):
    """Ink on cotton with a little screen-print unevenness and fabric grain."""
    th, tw = alpha.shape
    uneven = ndi.gaussian_filter(rng.normal(0, 1, (th // 8 + 1, tw // 8 + 1)), 2)
    uneven = np.asarray(Image.fromarray(uneven.astype("float32")).resize((tw, th), Image.BICUBIC))
    a = np.clip(alpha * (0.93 + 0.07 * uneven / (np.abs(uneven).max() + 1e-6)), 0, 1)[..., None]
    out = ground * (1 - a) + colour * a
    weave = rng.normal(0, 2.6, (th, tw)) + np.sin(np.arange(tw) * 2.1)[None, :] * .8 + np.sin(np.arange(th) * 1.7)[:, None] * .8
    return out + weave[..., None]

def bands(out, period, width, colour, rng, kind):
    th, tw = out.shape[:2]
    for k in range(tw // period):
        x = k * period + period // 2 - width // 2
        if kind == "satin":
            sheen = .78 + .22 * np.sin(np.linspace(0, np.pi, width)) ** 3
            col = colour * sheen[None, :, None]
            if (colour == SATIN_WHITE).all():
                col = colour - (1 - np.sin(np.linspace(0, np.pi, width)))[None, :, None] * 28
            out[:, x:x + width] = col
            out[:, x:x + 2] = out[:, x:x + 2] * .82; out[:, x + width - 2:x + width] *= .82
        else:  # fabric band with a ragged edge and woven streaks
            streak = rng.normal(0, 7, (1, width + 8)) + rng.normal(0, 5, (th, width + 8)) * .6
            edge_l = (ndi.gaussian_filter(rng.normal(0, 2.2, th), 6)).astype(int)
            edge_r = (ndi.gaussian_filter(rng.normal(0, 2.2, th), 6)).astype(int)
            for yy in range(th):
                a, b = x + edge_l[yy], x + width + edge_r[yy]
                out[yy, a:b] = BAND + streak[yy if streak.shape[0] > 1 else 0, : b - a, None]
    return out

def pinstripes(out, period, rng):
    th, tw = out.shape[:2]
    for k in range(tw // period):
        x = k * period + period // 2
        out[:, x - 26:x - 20] = INK
        out = bands(out, period, 0, SATIN_RED, rng, "satin") if False else out
        w = 36; sheen = .8 + .2 * np.sin(np.linspace(0, np.pi, w)) ** 3
        out[:, x - 14:x - 14 + w] = SATIN_RED * sheen[None, :, None]
        out[:, x + 28:x + 34] = INK
    return out

def save(arr, name):
    Image.fromarray(np.clip(arr, 0, 255).astype("uint8")).save(os.path.join(OUT, name), quality=84, method=6)
    print(name, arr.shape[1], "x", arr.shape[0])

if __name__ == "__main__":
    rng = np.random.default_rng(SEED)
    lips_img, eyes_img, hands_img = load("lips-sample.png"), load("eyes-sample.png"), load("hands-sample.png")
    lips = [cut(lips_img, b, "ink", margin=5) for b in LIPS]
    eyes = [cut(eyes_img, b, "ink", keep_t=.3, margin=6) for b in EYES]
    # her red eyes are the same lashed-eye print; the black samples are much sharper,
    # so the red walls print those in red (the red sample cuts stay available as RED_EYES)
    reyes = eyes
    hands = [cut(hands_img, b, "ink", margin=6) for b in HANDS]
    if os.environ.get("PREVIEW"):
        sheet = []
        for group, col in ((lips, INK), (eyes, INK), (reyes, RED), (hands, INK)):
            H = max(x.shape[0] for x in group); row = np.full((H + 20, sum(x.shape[1] + 20 for x in group), 3), COTTON)
            X = 10
            for x in group:
                row[10:10 + x.shape[0], X:X + x.shape[1]] = COTTON * (1 - x[..., None]) + col * x[..., None]; X += x.shape[1] + 20
            sheet.append(row)
        W = max(r.shape[1] for r in sheet)
        img = np.concatenate([np.pad(r, ((0, 0), (0, W - r.shape[1]), (0, 0)), constant_values=255) for r in sheet])
        Image.fromarray(img.astype("uint8")).save("/tmp/motifs.png"); raise SystemExit

    T = 1200
    # lips: black with white satin ribbons (as in "Pod cipkom"), and red with red satin + black pinstripes
    L = scatter(lips, T, T, 40, 1.02, 32, rng=rng)
    save(bands(print_ink(L, INK, COTTON, rng), 400, 30, SATIN_WHITE, rng, "satin"), "lips-print.webp")
    L2 = scatter(lips, T, T, 40, 1.02, 32, rng=rng)
    save(pinstripes(print_ink(L2, RED, COTTON, rng), 400, rng), "lips-red.webp")
    save(print_ink(L2, RED, COTTON, rng), "lips-red-plain.webp")
    # lashed eyes, black
    E = scatter(eyes, T, T, 30, .98, 18, rng=rng)
    save(print_ink(E, INK, COTTON, rng), "eyes-print.webp")
    E2 = scatter(eyes, T, T, 30, .98, 18, rng=rng)
    eb = print_ink(E2, INK, COTTON, rng)
    for k in range(3): x = k * 400 + 340; eb[:, x:x + 60] = INK
    save(eb, "eyes-ink-band.webp")
    # red eyes in cotton between black bands
    R = scatter(reyes, T, T, 30, .98, 16, rng=rng)
    rb = print_ink(R, RED, COTTON, rng)
    for k in range(3): x = k * 400 + 340; rb[:, x:x + 60] = INK
    save(rb, "eyes-red-band.webp")
    save(print_ink(R, RED, COTTON, rng), "eyes-red.webp")
    # hands wallpaper with grey fabric bands
    H = scatter(hands, T, T, 26, .95, 180, scale=(.9, 1.1), rng=rng)
    save(bands(print_ink(H, INK, COTTON, rng), 300, 64, BAND, rng, "fabric"), "hands-print.webp")

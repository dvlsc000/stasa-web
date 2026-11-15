"""Build the wall patterns from samples of Staša's own prints.

Sources live in images/textures/source/:
  eyes-sample.png  - one lashed eye from her eye print (cut from the collage "Oci")
  hands-sample.png - the hand wallpaper with grey bands (Matador's Darling)
  lips-sample.png  - black lips print with white satin stripes (Under lace)

Swap in sharper photos of the same prints with the same names and run:
  python3 tools/make_textures.py
(needs Pillow and numpy). Positions below are in source pixels; if a new
photo has a different size, adjust the crop numbers marked SOURCE.
"""
from PIL import Image, ImageFilter
import numpy as np, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "images", "textures", "source")
OUT = os.path.join(HERE, "..", "images", "textures")
COTTON = np.array([238, 233, 223.]); INK = np.array([17, 16, 16.]); RED = np.array([200, 22, 30.]); WHITE = np.array([251, 250, 246.])

def gray(name, crop=None):
    im = Image.open(os.path.join(SRC, name)).convert("L")
    if crop: im = im.crop(crop)
    return im

def up(im, k):
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))

def density(g, bg=None, ink=None):
    a = np.asarray(g).astype(float)
    bg = np.percentile(a, 88) if bg is None else bg
    ink = np.percentile(a, 2) if ink is None else ink
    return np.clip((bg - a) / (bg - ink), 0, 1)

def paint(d, ground, colour):
    d = d[..., None]
    out = ground * (1 - d) + colour * d
    rng = np.random.default_rng(7)
    out += rng.normal(0, 3.2, out.shape[:2])[..., None]      # printed grain
    return Image.fromarray(np.clip(out, 0, 255).astype("uint8"))

def tone(g):
    """Keep the photo's own greys but map them onto ink -> cotton -> white."""
    a = np.asarray(g).astype(float) / 255.0
    lo, mid = np.percentile(a, 2), np.percentile(a, 80)
    t = np.clip((a - lo) / (mid - lo), 0, 1.25)[..., None]
    out = np.where(t <= 1, INK + (COTTON - INK) * t, COTTON + (WHITE - COTTON) * ((t - 1) / .25))
    return Image.fromarray(np.clip(out, 0, 255).astype("uint8"))

def wrap_v(img, blend):
    """Make a tile seamless top-to-bottom by cross-fading its ends."""
    a = np.asarray(img).astype(float); H = a.shape[0]
    top, bot = a[:blend], a[H - blend:]
    w = np.linspace(0, 1, blend)[:, None] if a.ndim == 2 else np.linspace(0, 1, blend)[:, None, None]
    a = a.copy(); a[:blend] = bot * (1 - w) + top * w
    return Image.fromarray(np.clip(a[:H - blend], 0, 255).astype("uint8"))

def save(img, name):
    img.convert("RGB").save(os.path.join(OUT, name), quality=86, optimize=True, progressive=True)
    print(name, img.size)

K = 2.6  # upscale factor

# ---- LIPS: one stripe-to-stripe column of the print (SOURCE x 38..95), repeats sideways
lips_g = up(gray("lips-sample.png", (38, 110, 95, 480)), K)
lips_g = wrap_v(lips_g, 60)
save(tone(lips_g), "lips-print.jpg")                               # her black lips + white satin, as printed
save(paint(density(np.asarray(lips_g), bg=205), COTTON, RED), "lips-red.jpg")  # same lips in red, stripes left out

# ---- HANDS: one band-to-band column of the wallpaper (SOURCE x 45..111)
hands_g = up(gray("hands-sample.png", (45, 0, 111, 215)), K)
hands_g = wrap_v(hands_g, 70)
save(tone(hands_g), "hands-print.jpg")

# ---- EYES: one lashed eye from her print, edges feathered so nothing looks cut
eyes_g = up(gray("eyes-sample.png"), 2.4)
d = density(np.asarray(eyes_g))
d = np.clip((d - .1) / .9, 0, 1)
h, w = d.shape
fy = np.clip(np.minimum(np.arange(h) / (h * .22), (h - 1 - np.arange(h)) / (h * .14)), 0, 1)
fx = np.clip(np.minimum(np.arange(w) / (w * .12), (w - 1 - np.arange(w)) / (w * .12)), 0, 1)
d = d * np.sqrt(fy[:, None] * fx[None, :])

def layout(tw, th, places):
    canvas = np.zeros((th, tw))
    for (x, y) in places:
        for ox in (-tw, 0, tw):
            for oy in (-th, 0, th):
                x0, y0 = x + ox, y + oy
                xs, ys = max(0, x0), max(0, y0); xe, ye = min(tw, x0 + w), min(th, y0 + h)
                if xe > xs and ye > ys:
                    canvas[ys:ye, xs:xe] = np.maximum(canvas[ys:ye, xs:xe], d[ys - y0:ye - y0, xs - x0:xe - x0])
    return canvas

# black eyes on cotton, half-drop repeat
tile = layout(int(w * 2.3), int(h * 2.2), [(int(w * .2), int(h * .2)), (int(w * 1.35), int(h * 1.3))])
save(paint(tile, COTTON, INK), "eyes-print.jpg")
save(paint(tile, COTTON, RED), "eyes-red.jpg")

def band_tile(colour, name):
    bw = int(w * 1.5); band = int(bw * .22); th = int(h * 2.1)
    col = layout(bw, th, [((bw - w) // 2, int(h * .1)), ((bw - w) // 2, int(h * 1.15))])
    img = np.asarray(paint(col, COTTON, colour)).copy()
    img = np.concatenate([img, np.tile(INK.astype("uint8"), (th, band, 1))], axis=1)
    save(Image.fromarray(img), name)
band_tile(RED, "eyes-red-band.jpg")      # red eyes in cotton bands between black stripes (Platinum)
band_tile(INK, "eyes-ink-band.jpg")      # black eyes in cotton bands between black stripes

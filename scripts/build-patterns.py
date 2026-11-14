#!/usr/bin/env python3
"""Writes the pattern library to /public/patterns/*.svg.
Every pattern is an original, tileable SVG drawn only in the three site colours.
Run:  python3 scripts/build-patterns.py   (only needed if you change a pattern)
"""
import os, math

PAPER, RED, INK = "#F3EEE4", "#D9251D", "#121010"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "patterns")
os.makedirs(OUT, exist_ok=True)

def save(name, w, h, body, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{rect}{body}</svg>'
    open(os.path.join(OUT, name + ".svg"), "w").write(svg)

# ---------- 1. polka dots (half-drop) ----------
def dots(name, fg, bg, size=32, r=6.2):
    s = size
    body = f'<g fill="{fg}"><circle cx="{s*.25}" cy="{s*.25}" r="{r}"/><circle cx="{s*.75}" cy="{s*.75}" r="{r}"/></g>'
    save(name, s, s, body, bg)
dots("dots-red", RED, PAPER)
dots("dots-ink", PAPER, INK)
dots("dots-red-on-ink", RED, INK)
dots("dots-paper-on-red", PAPER, RED)

# ---------- 2. stripes ----------
save("stripes-red", 40, 40, f'<rect width="20" height="40" fill="{RED}"/>', PAPER)
save("stripes-ink", 40, 40, f'<rect width="20" height="40" fill="{INK}"/>', PAPER)

# ---------- 5. gingham, two-colour: crossings solid, single bands hatched ----------
hatch = "".join(f'<line x1="{i}" y1="0" x2="{i-48}" y2="48" />' for i in range(0, 100, 4))
g = (f'<defs><clipPath id="q"><rect x="24" y="0" width="24" height="24"/><rect x="0" y="24" width="24" height="24"/></clipPath></defs>'
     f'<rect width="24" height="24" fill="{RED}"/>'
     f'<g stroke="{RED}" stroke-width="1.3" clip-path="url(#q)">{hatch}</g>')
save("gingham", 48, 48, g, PAPER)

# ---------- motifs (line drawings, stroke = ink) ----------
EYE_LID = "M6,30 C24,8 76,8 94,30 C76,52 24,52 6,30 Z"
def lash_eye(cx, cy, s, colour, iris=None, pupil=INK, sw=2.2):
    """an almond eye with lashes; s=scale (1 → 100×60)"""
    lashes = ""
    for t in [0.12, 0.26, 0.42, 0.58, 0.74, 0.88]:
        # point on upper lid (cubic), and outward normal
        x0, y0, x1, y1, x2, y2, x3, y3 = 6, 30, 24, 8, 76, 8, 94, 30
        mt = 1 - t
        px = mt**3*x0 + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t**3*x3
        py = mt**3*y0 + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t**3*y3
        dx = 3*mt*mt*(x1-x0) + 6*mt*t*(x2-x1) + 3*t*t*(x3-x2)
        dy = 3*mt*mt*(y1-y0) + 6*mt*t*(y2-y1) + 3*t*t*(y3-y2)
        n = math.hypot(dx, dy); nx, ny = dy/n, -dx/n
        L = 13 if 0.2 < t < 0.8 else 10
        lashes += f'<path d="M{px:.1f},{py:.1f} q{nx*L*.5 - dx/n*2:.1f},{ny*L*.5 - dy/n*2:.1f} {nx*L - dx/n*4:.1f},{ny*L - dy/n*4:.1f}"/>'
    iris_c = iris or colour
    return (f'<g transform="translate({cx},{cy}) scale({s}) translate(-50,-30)" stroke="{colour}" stroke-width="{sw}" fill="none" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="{EYE_LID}" fill="{PAPER}"/>{lashes}'
            f'<circle cx="50" cy="30" r="13" fill="{iris_c}" stroke="none"/><circle cx="50" cy="30" r="6" fill="{pupil}" stroke="none"/>'
            f'<circle cx="54" cy="26" r="2.2" fill="{PAPER}" stroke="none"/></g>')

def ink_g(tx, ty, s, inner, rot=0):
    return (f'<g transform="translate({tx},{ty}) rotate({rot}) scale({s})" fill="none" stroke="{INK}" stroke-width="{1.7/s:.2f}" '
            f'stroke-linecap="round" stroke-linejoin="round">{inner}</g>')

HAND = ("M-12,40 L-12,20 C-20,14 -28,6 -31,-1 C-33,-7 -27,-10 -22,-5 L-13,4 L-13,-28 C-13,-34 -5,-34 -5,-28 L-5,-6 "
        "L-4,-38 C-4,-44 4,-44 4,-38 L4,-6 L6,-34 C6,-40 14,-40 14,-34 L12,-4 L17,-24 C18,-30 25,-29 24,-23 L18,14 C16,24 14,30 14,40")
PALM_EYE = "M-9,12 C-4,5 6,5 11,12 C6,19 -4,19 -9,12 Z M1,12 m-2.5,0 a2.5,2.5 0 1,0 5,0 a2.5,2.5 0 1,0 -5,0"
FACE = ("M0,-30 C18,-30 24,-14 24,2 C24,20 12,32 0,32 C-12,32 -24,20 -24,2 C-24,-14 -18,-30 0,-30 Z "
        "M-15,-2 C-12,2 -6,2 -3,-2 M-13,1 l-2,4 M-9,2 l-1,4 M-5,1 l1,4 "
        "M3,-2 C6,2 12,2 15,-2 M5,1 l-1,4 M9,2 l1,4 M13,1 l2,4 "
        "M0,4 L-2,12 L2,12 M-7,19 C-3,16 3,16 7,19 C3,23 -3,23 -7,19 Z")
MOON = ("M8,-28 C-14,-24 -22,0 -12,16 C-6,26 6,30 14,28 C-2,22 -10,6 -6,-8 C-4,-18 2,-24 8,-28 Z "
        "M-6,-6 C-3,-3 0,-3 2,-6 M-3,-4 l-1,3 M0,-4 l1,3 M-4,8 C-1,10 2,10 4,7")
LIPS = "M-22,0 C-14,-10 -6,-12 0,-6 C6,-12 14,-10 22,0 C12,12 -12,12 -22,0 Z M-22,0 C-8,3 8,3 22,0"
MANICULE = ("M-34,-10 L-22,-10 L-22,12 L-34,12 Z M-31,-10 L-31,12 "
            "M-22,-8 C-16,-14 -6,-14 0,-12 L32,-12 C37,-12 37,-5 32,-5 L6,-5 "
            "C10,-4 10,2 6,3 C10,4 10,9 5,10 C8,11 8,16 3,16 L-14,16 C-18,16 -22,14 -22,12 "
            "M6,-5 L-2,-5 M6,3 L-1,3 M5,10 L-1,10")
STAR = "M0,-10 L3,-3 L10,-3 L4,2 L6,10 L0,5 L-6,10 L-4,2 L-10,-3 L-3,-3 Z"
EAR = "M-6,-18 C8,-22 14,-6 6,4 C2,9 4,16 -2,18 C-8,20 -10,12 -6,10 M-2,-10 C4,-10 6,-4 2,0 C0,2 -2,4 0,6"
KEY = "M0,-18 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0 M0,-11 L0,18 M0,12 L7,12 M0,6 L5,6"
FLOWER = ("M0,-4 C-6,-16 6,-16 0,-4 M0,-4 C12,-10 12,2 0,-4 M0,-4 C6,8 -6,8 0,-4 M0,-4 C-12,2 -12,-10 0,-4 "
          "M0,4 C0,12 -2,18 -6,24 M-2,14 C-8,10 -12,12 -12,16 C-8,18 -4,16 -2,14")

# ---------- 3. ink wallpaper: two vertical bands, motifs in a half-drop ----------
W3, H3 = 220, 360
band = (f'<g stroke="{INK}" stroke-width="1.4" fill="none">'
        f'<line x1="1" y1="0" x2="1" y2="{H3}"/><line x1="7" y1="0" x2="7" y2="{H3}"/>'
        f'<line x1="111" y1="0" x2="111" y2="{H3}"/><line x1="117" y1="0" x2="117" y2="{H3}"/></g>'
        + "".join(f'<circle cx="4" cy="{y}" r="1.6" fill="{INK}"/><circle cx="114" cy="{y+20}" r="1.6" fill="{INK}"/>' for y in range(10, H3, 40)))
motifs = (
    ink_g(58, 52, 0.95, f'<path d="{HAND}"/><path d="{PALM_EYE}"/>', -6)
    + lash_eye(58, 150, 0.5, INK, iris=INK, pupil=PAPER, sw=3)
    + ink_g(58, 250, 1, f'<path d="{FACE}"/>')
    + ink_g(56, 330, 0.8, f'<path d="{LIPS}"/>')
    + ink_g(166, 24, 1, f'<path d="{STAR}"/>', 12)
    + ink_g(166, 98, 0.85, f'<path d="{MOON}"/>', 8)
    + ink_g(164, 186, 0.8, f'<path d="{MANICULE}"/>', -4)
    + ink_g(170, 262, 1, f'<path d="{EAR}"/>')
    + ink_g(166, 326, 1, f'<path d="{FLOWER}"/>')
)
save("wallpaper-ink", W3, H3, band + motifs, PAPER)

# ---------- 4. lash-eye repeat, red on paper ----------
save("eyes", 120, 90, lash_eye(32, 24, 0.38, RED) + lash_eye(92, 69, 0.38, RED), PAPER)

# ---------- 6. scallop + lace edges (alpha masks for the flounce hems) ----------
# horizontal: opaque top strip, semicircles hanging below. vertical: same, rotated (hem on the right)
save("scallop", 40, 20, '<path d="M0,0 L40,0 L40,4 A10,10 0 0 1 20,4 A10,10 0 0 1 0,4 Z" fill="#000"/>')
save("scallop-v", 20, 40, '<path d="M0,0 L4,0 A10,10 0 0 1 4,20 A10,10 0 0 1 4,40 L0,40 Z" fill="#000"/>')
lace_h = ("M0,0 L48,0 L48,8 C44,22 28,22 24,8 C20,22 4,22 0,8 Z "
          "M12,13 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M36,13 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 "
          "M24,3 m-1.6,0 a1.6,1.6 0 1,0 3.2,0 a1.6,1.6 0 1,0 -3.2,0 M0,3 m-1.6,0 a1.6,1.6 0 1,0 3.2,0 a1.6,1.6 0 1,0 -3.2,0 M48,3 m-1.6,0 a1.6,1.6 0 1,0 3.2,0 a1.6,1.6 0 1,0 -3.2,0")
save("lace", 48, 22, f'<path fill-rule="evenodd" d="{lace_h}" fill="#000"/>')
save("lace-v", 22, 48, f'<g transform="translate(0,48) rotate(-90)"><path fill-rule="evenodd" d="{lace_h}" fill="#000"/></g>')

# motif source for the inline sprite (read by src/components/Sprite.astro via import)
import json
json.dump({"HAND": HAND, "PALM_EYE": PALM_EYE, "FACE": FACE, "MANICULE": MANICULE, "LIPS": LIPS, "EYE_LID": EYE_LID},
          open(os.path.join(os.path.dirname(__file__), "..", "src", "data", "motifs.json"), "w"))
print("patterns written to", os.path.abspath(OUT))

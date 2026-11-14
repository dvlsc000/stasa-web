#!/usr/bin/env python3
"""
Makes transparent cut-outs of every photo in /public/images/works
and saves them as /public/images/cutouts/<same name>.webp

    npm run cutouts

First time only, install the background remover (needs Python 3.10+):

    pip install "rembg[cpu]" pillow

The first run downloads a ~170 MB model, so it takes a minute. Detail shots
(files ending in -detail) are skipped. Existing cut-outs are kept unless you
pass --force. Check each result: hats with veils or feathers sometimes need a
touch-up in any image editor.
"""
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "images" / "works"
DST = ROOT / "public" / "images" / "cutouts"
force = "--force" in sys.argv

try:
    from rembg import remove, new_session
    from PIL import Image
except ImportError:
    sys.exit('rembg is not installed. Run:  pip install "rembg[cpu]" pillow   and try again.')

DST.mkdir(parents=True, exist_ok=True)
photos = [p for p in sorted(SRC.iterdir()) if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"} and "-detail" not in p.stem]
if not photos:
    sys.exit(f"No photos found in {SRC}. Name them after the plate, e.g. pl-017.jpg.")

session = new_session("isnet-general-use")  # good with fabric edges, feathers and tulle
for p in photos:
    out = DST / f"{p.stem}.webp"
    if out.exists() and not force:
        print(f"  skip  {out.name} (exists — use --force to redo)")
        continue
    img = Image.open(p).convert("RGB")
    img.thumbnail((2400, 2400))
    cut = remove(img, session=session, alpha_matting=True, alpha_matting_foreground_threshold=240,
                 alpha_matting_background_threshold=12, alpha_matting_erode_size=8)
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    cut.save(out, "WEBP", quality=88, method=6)
    print(f"  done  {out.name}")
print("Cut-outs ready. Now run:  npm run images  (or just npm run dev)")

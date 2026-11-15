# Staša Čimbur — website

A static website: plain HTML, CSS and JavaScript. It needs no build step and no framework.

## Run it locally
Open a terminal in this folder and run:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Use a local server rather than double-clicking `index.html`. Without one, the halftone "print" effect can't read the photos, so it switches itself off.

## Swap a photo
1. Put the photo in `images/works/`, for example `crni-labud.jpg`. A JPG about 1600px on the long side is plenty.
2. Open `js/content.js`, find the work (e.g. `id:"pl-001"`) and change `image:null` to `image:"images/works/crni-labud.jpg"`.

That's all. The placeholder plate disappears, and the photo gets the halftone reveal and the zoomable detail view automatically.

## Change text
Everything you can read is in `js/content.js`:
- `UI` holds the interface text, one block per language: hr, en, nl, es, de, fr.
- `STORIES` holds the descriptions. Each work uses the story of its room, or its own `story` key.
- `WORKS` holds titles, years, materials, dimensions, availability and prices. Use `price: 450` to show a price, or `null` for "price on request".
- `EXHIBITIONS` holds the exhibition list. Years are left blank where they still need confirming.
- `SITE` holds the contact email, Instagram link and default language.

## Add a new piece
Copy one entry in `WORKS` and give it a new `id`.
- For the walk (Wing I), use `wing:"wearable"` and a `room` (hats, headpieces, bags, parasols, textiles, clothes).
- For framed originals, use `wing:"wall"`.
- For prints, use `wing:"print"`.

A room can hold any number of pieces. The walk gets longer by itself, and pieces alternate between hanging on the wall and standing lower. A piece can have extra photos for the detail view: `gallery:["images/works/extra.jpg"]`. Framed works take `frame:"black"`, `"wood"` or `"float"`.

## Room walls
Each room's wall pattern is set in `ROOMS` (`wall:`). The patterns are taken from Staša's collages:
`curtain` (red velvet, like her studio photos), `hands` (her hand wallpaper), `eyes-stripes` (red eyes in bands between black stripes), `lips-stripes` (red lips between satin and black pinstripes), `eyes-ribbons` (white eyes on black with red ribbons), `lips-red`, `lips-ink`, `eyes-red`, `eyes-ink`, `satin-stripes`, plus `stripes-red`, `dots-red`, `dots-ink`, `halftone`. You can replace a pattern with a crop of one of Staša's own fabrics. Add a CSS class `.tex-yourname { background: url(../images/textures/yourfile.jpg); }` to `css/style.css` and use `wall:"yourname"`.

## Her print patterns (eyes, lips, hands)
The walls, the opening screen and the footer use Staša's own prints, rebuilt in high quality by `tools/make_textures.py`. The script:
1. enlarges the sample photos in `images/textures/source/` 4x with an AI super-resolution model (EDSR); the enlarged `*-x4.png` copies are saved, so this runs only once,
2. cuts every clean lip, lashed eye and hand out of the samples, keeping the real printed tones,
3. scatters them at random positions, angles and sizes over seamless 1200 px tiles (shown at 600 px, so they stay sharp on retina screens), adding the satin ribbons and fabric bands.

The samples are `lips-sample.png` (*Pod čipkom*), `eyes-sample.png` (lashed-eye print) and `hands-sample.png` (hand wallpaper and red eyes). To change the random arrangement, edit `SEED` in the script and run `python3 tools/make_textures.py`. A sharper photo of a fabric gives even crisper walls: save it over the sample, delete its `-x4.png` and update the boxes in the script.

## 3D hat
The rotating black hat in front of the red curtain is drawn in code in `js/hat3d.js`, using three.js from `vendor/`. It's modelled on the black straw hat with the bow. Brim waves, colours and lights are all at the top of that file. It only renders while it's on screen, and visitors can drag it or turn it with the arrow keys.

## Film
`media/film.mp4` is a silent, smaller copy of the six-looks film. It plays muted while on screen, and visitors can pause it. To replace it, keep the same file name, or change the `src` in `index.html`.

## Contact form
The form checks the fields but doesn't send anything yet. To connect it, look for `TODO` in `js/main.js`. A form service such as Formspree or Netlify Forms takes a few lines.

## Publish online
Drag this folder onto https://app.netlify.com/drop, or push it to GitHub and import it into Vercel or Netlify. No settings are needed.

## What's inside
- `index.html`: page structure
- `css/style.css`: all styling (colours and fonts are at the top in `:root`)
- `css/fonts.css` and `fonts/`: self-hosted Bodoni Moda, Newsreader and Cutive Mono (all open licence)
- `js/content.js`: all content
- `js/thread.js`: the hand-drawn thread lines and printed eye pattern
- `js/main.js`: languages, the walk, detail view, halftone effect, film, form
- `js/hat3d.js`: the 3D hat
- `media/`: the film
- `vendor/`: GSAP + ScrollTrigger and Lenis (smooth scroll)

Motion respects the visitor's "reduce motion" setting. With that setting on, the walk becomes a normal vertical page and every effect switches off.

## Photos
Most photos in `images/works/` are Staša's own. Three were first taken from the web as stand-ins: `matadors-darling.jpg`, `vrpce.jpg` and `oko.jpg`. Replace them with her own files before launch. The `look-*.jpg` stills come from the fashion-shoot video, so they're small. Swap in the original photographs when you have them.

Titles, years and materials for the newer pieces are best guesses from the photos. Check them in `js/content.js`.

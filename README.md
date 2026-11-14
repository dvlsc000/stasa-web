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

Each room shows its first two pieces in the walk layout. To show more per room, the walk layout needs a third position, so ask a developer, or Claude, to add one.

## Room walls
Each room's wall pattern is set in `ROOMS` (`wall:`): `eyes-ink`, `stripes-red`, `dots-red`, `dots-ink`, `eyes-red`, `halftone`. You can replace a pattern with a crop of one of Staša's own fabrics. Add a CSS class `.tex-yourname { background: url(../images/textures/yourfile.jpg); }` to `css/style.css` and use `wall:"yourname"`.

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
- `js/main.js`: languages, the walk, detail view, halftone effect, form
- `vendor/`: GSAP + ScrollTrigger and Lenis (smooth scroll)

Motion respects the visitor's "reduce motion" setting. With that setting on, the walk becomes a normal vertical page and every effect switches off.

## Photo rights
The three artwork photos currently in `images/works/` were taken from the web as stand-ins. Replace them with Staša's own photographs before the site goes public.

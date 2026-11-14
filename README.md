# Salon Čimbur — the StashaHats website

A walk-through collage for Staša Čimbur, in Croatian, English, Dutch, Spanish, German and French.

- `DESIGN.md` explains the colours, patterns, fonts and motion.
- `AUDITS.md` lists what was checked and fixed.

---

## 1. Run it on your computer

You need **Node.js 20 or newer** (download from nodejs.org). Then open a terminal in this folder and run:

```bash
npm install        # once
npm run dev        # opens at http://localhost:4321  — changes appear as you save
```

To make the finished site (the `dist` folder):

```bash
npm run build
npm run preview    # look at the finished build
```

---

## 2. Change text

All words live in **one file per language** in `content/i18n/`:

```
content/i18n/hr.json   ← Croatian (the default)
content/i18n/en.json   content/i18n/nl.json   content/i18n/es.json
content/i18n/de.json   content/i18n/fr.json
```

Each file has two parts:

- **`"ui"`** holds the site text: headings, the prologue, the quote, the form labels and so on. Change the text inside the quotes, and keep the key on the left the same.
- **`"works"`** holds, for each piece (by its plate number, e.g. `"pl-017"`), its `title`, `materials`, `technique`, `story` (2–4 sentences) and `alt`. The `alt` is a short description of the photo for blind visitors; describe what it looks like.

Text inside the quotes can use any letters (č ć š ž đ é ü ß…). If the text itself needs a straight double quote, write it as `\"`. It's easier to use the language's own quotation marks: „…“ « … » “…”.

Other settings are in `content/site.json`: email, Instagram link, web address, the portrait, and which pieces land in the opening collage (`heroCutouts`).

> ⚠️ **To check before launch.** The **email address and Instagram link** in `content/site.json` are guesses. The **exhibition list** in `content/exhibitions.json` is a placeholder: only "All you need is a Hat" at MUO Zagreb, a Gemeentemuseum Den Haag show and the Josipa Lisac collaboration come from the brief. Every year, title and venue must be checked or replaced. The **prologue text, the quote and all 36 pieces** are placeholder copy.

---

## 3. Swap photos

Put photos in `public/images/works/`, named after the plate number:

| File | What it is |
|---|---|
| `pl-017.jpg` | the main photo of plate 017 |
| `pl-017-detail.jpg` | a close-up (stitching, texture), shown in the plate view |
| `public/images/cutouts/pl-017.webp` | optional: the piece with a transparent background, used in the hero and the walk (see section 5) |
| `public/images/portrait.jpg` | Staša's portrait in the prologue |

JPG, PNG or WebP all work, up to any size. The site makes small AVIF/WebP versions automatically when you run `npm run dev` or `npm run build`. Until a photo exists, the piece is shown as a stitched paper placeholder with its plate number and a small red eye.

To use the reference artwork's colours, see the note at the top of `DESIGN.md`.

---

## 4. Add a new piece

1. Open `content/works.json` and copy one block `{ … }`. Paste it at the end, with a comma between blocks. Then change:

   | Field | Meaning |
   |---|---|
   | `id` | new plate number, e.g. `"pl-037"` |
   | `slug` | the web address part, e.g. `"red-velvet-cloche"`: lowercase, hyphens, no spaces |
   | `wing` | `"wearable"` (the walk) or `"wall"` (the salon hang) |
   | `room` | wearable: `hats`, `headpieces`, `bags`, `parasols`, `textiles` or `clothes`; wall: `framed` or `collage` |
   | `year` | the year |
   | `dimensions` | e.g. `"50 × 70 cm"` |
   | `available` | `true` or `false` |
   | `price` | a number in euro, e.g. `950`, or `null` to show "Price on request" |
   | `depth` | `0` to `1`: how far back it hangs in the walk (0 = close and large) |
   | `wallpaper` | the pattern behind it on its plate: `wallpaper-ink`, `eyes`, `dots-red`, `dots-ink`, `stripes-red` or `gingham` |
   | `size`, `frame` | wall pieces only. `size`: `s`, `m`, `l`, `xl` or `wide`. `frame`: `lacquer`, `dots` or `stitched` |
   | `placeholder` | which stitched silhouette to show until there's a photo, e.g. `cloche`, `brim`, `parasol-open` |

2. Add its texts (`title`, `materials`, `technique`, `story`, `alt`) under `"works"` in **each** of the six language files, using the same `id`.
3. Add its photo as `public/images/works/pl-037.jpg`.

Rooms grow by themselves: each extra piece makes its room a little longer.

---

## 5. Make cut-outs (transparent backgrounds)

This needs Python 3.10+ (on Windows, tick "Add Python to PATH" when installing). Install the background remover once:

```bash
pip install "rembg[cpu]" pillow
```

Then run:

```bash
npm run cutouts
```

This makes `public/images/cutouts/pl-xxx.webp` for every photo in `public/images/works/` (detail shots are skipped). The first run downloads a ~170 MB model. Existing cut-outs are kept; run `node scripts/run-python.mjs scripts/cutouts.py --force` to redo them. Check veils, tulle and feathers by eye, since you may want to tidy those in an image editor.

---

## 6. The contact form

The form sends its data (as JSON) to whatever address you set:

1. Create a free form endpoint, e.g. at formspree.io.
2. Copy `.env.example` to `.env` and fill in `PUBLIC_FORM_ENDPOINT=https://formspree.io/f/xxxx`.
3. On Netlify or Vercel, add the same variable under **Environment variables**, then redeploy.

Until then the form shows a success message but **sends nothing** (marked `TODO` in `src/scripts/form.ts`).

---

## 7. Put it online

**Netlify:** push this folder to a GitHub repository. In Netlify choose **Add new site → Import from Git** and pick the repository. The settings come from `netlify.toml`, so just press Deploy.

**Vercel:** same idea. **Add New → Project**, import the repository, and the settings come from `vercel.json`.

After the first deploy, set your real domain in `content/site.json` (`siteUrl`) and in `public/robots.txt`, then deploy again. This matters for the share images and search engines.

---

## How it's built (for developers)

- **Astro 7**, static output. Pages: `/{lang}/` and `/{lang}/work/{slug}/` (216 plate pages), plus `sitemap.xml`. `/` redirects using the browser language.
- **Scripts:** vanilla TypeScript in `src/scripts/`, with GSAP ScrollTrigger and Lenis. There is no UI framework.
- **Plate overlay:** the plate opens by fetching its own page into a `<dialog>`, and updates the URL with `history.pushState`.
- **Styles:** plain CSS in `src/styles/` (tokens, base, cuts, components, sections, plate).
- **Patterns:** `scripts/build-patterns.py` writes the SVG patterns. Rerun with `npm run patterns` after editing.
- **Images:** `scripts/images.mjs` makes responsive images and `src/data/image-manifest.json`.
- **Fonts:** in `public/fonts/` with their licences, all SIL Open Font License.

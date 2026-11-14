# Salon Čimbur — design note

The site is one of Staša's collages that you can walk through. Every decision below goes back to *Matador's Darling*: a patterned wall above, a flat black floor below, a figure cutting across on the diagonal, and pieces cut out, layered flat and stitched down by hand.

> **About the palette.** The artwork wasn't in the files I received, so the three colours below are the brief's starting values. Before launch, sample the real red, white and black from the artwork with an eyedropper, then change the three values in `src/styles/tokens.css` and at the top of `scripts/build-patterns.py`. After that, run `npm run patterns`.

## Palette (three colours, nothing else)

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F3EEE4` | warm paper white, the main ground |
| `--red` | `#D9251D` | hot poppy red: display type, patches, accents |
| `--ink` | `#121010` | flat ink: text, the floor, dark rooms |
| `--thread-on-dark` | `#E9E4DA` | stitch lines on ink and red |
| `--thread-on-light` | `#8F8A82` | stitch lines on paper (decorative only, never used for text) |

There are no gradients, glows or tints. Shadows are ink at low opacity, kept small and close, like paper lifted off paper. On moving cut-outs the shadow is baked in as a hard offset copy rather than a blur filter, which is cheaper to animate and looks more like layered paper.

**Contrast.** Ink on paper is 16.4:1. Red on paper is 4.29:1, so red is only used for display sizes, patches and marks, never for small text. Paper on red is also 4.29:1, so text on red patches is set at 24px or larger (WCAG large text). Error messages are ink text with a red stitched cross, so they never rely on colour alone.

## Pattern library (`public/patterns/*.svg`, made by `scripts/build-patterns.py`)

All patterns are original and tileable, they use only the three colours, and each file is under 6 KB.

1. **Polka dots**: red on paper, paper on ink and paper on red, each in two scales (set in CSS).
2. **Stripes**: red and paper, narrow (28px) and wide (88px).
3. **Ink wallpaper**: two vertical bands with ten line-drawn motifs: a hand with an eye in its palm, a lashed eye, a sleeping face, lips, a star, a moon face, a manicule, an ear and a flower. Dotted rules divide the bands.
4. **Lash-eye repeat**: small red lashed eyes on paper, in a half-drop.
5. **Gingham in two colours only**: where the bands cross the square is solid red, and where a single band runs the square is red hatching, so no third tone appears.
6. **Scallop and lace edges**: alpha masks for the flounce hems, in horizontal and vertical versions. The lace version has real holes.

Rules: every patterned area has a hand-cut edge, using one of six reusable polygons in `src/styles/cuts.css`. The stitch outline (`<Stitch>`) follows the same polygon about 3% inside the edge. Patterns never sit behind body text, so text always gets a paper or ink panel.

## Type

The brief's display face was the starting point. All three fonts are self-hosted woff2 files, subset to Latin and Latin Extended (č ć š ž đ ñ é ü ß ő « » „ “ are all present). They are 204 KB in total, and the display and body fonts are preloaded.

| Role | Face | Why |
|---|---|---|
| Display | **Basteleur** Bold and Moonlight (Keussel / Velvetyne, OFL) | Rendered against Mazius Display Extraitalic (Collletttivo) and Bluu Next Bold (Velvetyne). Basteleur won: it was drawn with the Tarot de Marseille in mind, so it has a playbill and cabaret weight that holds up at 18vw. Bluu Next has no Đ/đ, which rules it out for Croatian. Mazius is lovely but reads as fashion editorial rather than stage. |
| Labels | **Xanh Mono** (Lâm Bảo and Duy Dao, OFL) | Compagnon, the brief's suggestion, couldn't be downloaded from here (Velvetyne's servers were unreachable). Xanh Mono is an independent typewriter-style mono with real character and full Latin Extended, used for plate numbers, museum labels and the playbill. To switch to Compagnon later, put its woff2 in `/public/fonts` and change `--f-label`. |
| Body | **Ortica Linear** Regular and Light (Collletttivo, OFL) | A quiet, slightly angular serif from an independent Italian collective. It sits well beside Basteleur's swagger without competing with it, and stays readable at 17–19px. |

Scale: a perfect fourth (1.333) from a 19px body (17px on mobile), with display sizes up to 18rem. Numbers use tabular figures. Quotation marks are set per language: „hr“, “en”, ‘nl’, «es», „de“, « fr ».

**Signature.** "Staša Čimbur" is written as a single-stroke script path built from the public-domain Hershey *script simplex* font. It was smoothed with Catmull-Rom curves, and the two carons were drawn by hand. The thread writes it in the preloader and again at the end of the page.

## Grid

- 12 columns, with `--margin` from 1.1rem to 4.5rem and `--gutter` from 1rem to 2.5rem. The layout collapses to one column below 768px.
- Each section has its own composition:
  - **Hero**: a stage. Wall 63%, floor 37%, the name straddling the line.
  - **Prolog**: an asymmetric 5 + 6 theatre programme.
  - **Wall I (the walk)**: a horizontal track of 162vw rooms.
  - **Interlude**: a single quote on a black stage.
  - **Wall II (the salon hang)**: a 12 × 6 salon grid on a wall 248vw wide.
  - **Playbill**: a centred playbill with an index table.
  - **Commissions**: a 4 + 7 split, with the form on a piece of gingham cloth.

## Motion tokens

| Token | CSS | GSAP | Used for |
|---|---|---|---|
| walk | `cubic-bezier(.22,1,.36,1)` | `expo.out` | the walk, labels, room arrival |
| fabric drop | n/a | `back.out(1.25)`, 0.85s | a piece landing, with a small overshoot and settle |
| flick | `cubic-bezier(.16,1,.3,1)` | `expo.out`, stagger 0.12 | ruffle tiers, the plate opening |
| move | `cubic-bezier(.645,.045,.355,1)` | `sine.inOut` | things already on screen: the diorama, the stitch on the send button |
| stitch | n/a | 0.9s `power1.inOut` | running stitches pulling through |
| UI | 180ms `ease` | n/a | hover and press feedback |

Only `transform`, `opacity`, `clip-path` and SVG stroke properties are animated. Smooth scrolling uses Lenis (lerp 0.085), and scroll timelines use GSAP ScrollTrigger.

The **one 3D moment** is in the hero. As you scroll, the layers part with CSS `translateZ` inside `perspective: 1400px`, and the stage tilts (9°, −17°) into a pop-up diorama. Then everything folds back flat. It uses no extra JavaScript. Three.js was not needed, which saves its 150 KB budget entirely.

With `prefers-reduced-motion` there is no preloader, no pinning, no sway and no 3D. Rooms stack vertically, threads and the signature are drawn in full, and the Plate fades in.

# Audits: performance, accessibility, design

Tested in Chrome on the production build (`npm run build && npm run preview`) at 1440, 1024 and 390px, with and without reduced motion, in all six languages.

## Lighthouse (mobile, simulated Moto G throttling)

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/hr/` (home, with preloader) | **95** | **100** | **100** | **100** |
| `/en/work/matadors-darling/` | **98** | **100** | **100** | **100** |

Home: LCP 2.5 s, TBT 70 ms, CLS 0.001. The Lighthouse runs used placeholder art. Real photos go through the AVIF/WebP pipeline with `srcset` and blur-up; the hero image loads with `fetchpriority="high"` and the others lazy-load. Re-run Lighthouse after adding photos.

## 1 · Performance

| # | Finding | Fix |
|---|---|---|
| P1 | Scrolling through the walk dropped to about 30 fps (median frame 33 ms). Profiling layer by layer showed the cause: blurred `drop-shadow` filters on moving cut-outs and flounce tiers were repainted every frame. | **Fixed.** The shadow is baked into the cut-outs as a hard, close offset copy, and the tier shadows were removed. Median frame is now 16.7 ms (60 fps) even in a GPU-less headless browser. |
| P2 | Possible overflow and scroll fighting in the pinned sections when keyboard focus moved inside them. | **Fixed.** Pins use `overflow: clip`, which cannot be scrolled by focus. |
| P3 | Three.js for the diorama would have used most of the 150 KB budget. | **Avoided.** The diorama is CSS 3D: 0 KB of extra JavaScript. |
| P4 | Sections caused horizontal overflow on mobile (390 → 406px): tier bleed, museum labels and the thread. | **Fixed.** `main > section { overflow-x: clip }`, and labels sit flush on small screens. |
| P5 | Bundle size | Total JS is 55 KB gzip (GSAP + ScrollTrigger + Lenis + site code), loaded as one deferred module. CSS is 10 KB gzip. Home HTML is 25 KB gzip. The three fonts total 204 KB, and two are preloaded. The patterns are tiny SVGs, about 72 KB for all of them. |
| P6 | Plate pages are fetched when a piece is clicked. | Pages are prefetched on hover, and the previous and next plates are warmed when one opens. |

## 2 · Accessibility (axe-core 4 + a manual keyboard walk)

axe result after the fixes: **0 violations** on home (normal and reduced motion) and on plate pages.

| # | Finding | WCAG | Fix |
|---|---|---|---|
| A1 | **The 24 walk pieces could not be reached with Tab.** Their entrance animation hid them with `visibility: hidden` until they scrolled into view. | 2.1.1 Keyboard | **Fixed.** Entrances use opacity only. When a piece takes focus, the walk scrolls to it, which triggers its entrance. The same applies to salon frames. |
| A2 | The hero's decorative cut-outs were `role="img"` with an empty label. | 1.1.1 | **Fixed.** They are `aria-hidden`. The link around each one carries the label ("Open plate …"). |
| A3 | The header and footer language navs had the same accessible name. | best practice | **Fixed.** Each nav has its own label. |
| A4 | Closing a Plate moved focus back to the piece, and the focus-follow then re-scrolled the walk, so you didn't land at the exact spot. | 2.4.3 | **Fixed.** Restoring focus no longer re-scrolls. |
| A5 | Hidden "Skip the walk" link was still visible once pinned. | 2.4.1 | **Fixed.** It is now hidden until it receives focus. |

Verified behaviour:
- **Skip links**: "Skip to content" and "Skip the walk".
- **Focus**: every focusable element shows a red running-stitch focus outline (paper-coloured on ink).
- **Plate**: a native `<dialog>` opened with `showModal`, so the rest of the page is inert. Focus goes to Close. Esc and Close return focus to the piece. ←/→ step through plates, and swipe works on touch.
- **Form**: real `<label>`s. Errors are linked with `aria-describedby`, announced politely, and marked with a cross icon as well as colour. Status messages use `role="status"`.
- **Text alternatives**: alt text comes from the i18n files. The floor plan is a `<nav>` of anchors.
- **Contrast**: see DESIGN.md. Red is never used for small text.
- **Reduced motion**: rooms stack, nothing is pinned, nothing is hidden, and the preloader is skipped.
- **Cursor**: the eye cursor is shown on fine pointers only. The native caret is kept in form fields.

## 3 · Design engineering

| # | Finding | Fix |
|---|---|---|
| D1 | The Č caron in the patterned surname was invisible: paper-dot fill against the paper wall. | The letter is now red with paper dots, which reads on both the wall and the floor. The surname also dropped so the i-dot sits on the floor. |
| D2 | The cloche and the role line collided with the name in the hero. | Pieces were rearranged and the role line moved to the floor's bottom edge. |
| D3 | Threads ran through paragraphs (the prolog) and through the title (the playbill). | Threads now route through waypoints anchored to real elements (under titles, in the gutters), so they avoid text at every breakpoint. |
| D4 | Room titles overflowed ("Oglavlja i fascinatori", "Kopfschmuck und Fascinators"), and pieces overlapped each other's labels. | Titles were resized, rooms widened to 162vw, and labels moved below hanging pieces and above standing ones. |
| D5 | The salon wall was so tall that frames in the top-right corner were never on screen. | The pan is now mostly horizontal with a gentle downhill drift (18vh), so every frame comes into view. |
| D6 | The header covered paragraph text while reading. | The header steps aside as you scroll down and comes back as you scroll up (it always returns on keyboard focus). |
| D7 | The eye's red lid could not animate because the CSS transform overrode GSAP. | The lid is driven by a `--lid` custom property. |
| D8 | Anti-AI checklist | No centred hero, no gradients or glow, no rounded cards, no emoji, no stock icons (the eye, manicule, crossed-stitch ✕, zoom and Instagram icons are drawn by hand in SVG), and no fade-up on every element. Each section has its own composition. |

**Known limits.** Placeholder art is deliberately simple; the real photos and cut-outs will carry the site. The exhibition list is a placeholder (see README). The headless browser has no GPU, so check the walk on a real mid-range phone once photos are in.

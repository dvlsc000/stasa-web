import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isDesktop = () => innerWidth >= 768;

/** motion tokens, mirrored from tokens.css */
export const EASE = {
  walk: 'expo.out',          // ≈ cubic-bezier(0.22, 1, 0.36, 1) — the long, calm walk
  drop: 'back.out(1.25)',    // a piece landing: tiny overshoot, then it settles
  flick: 'expo.out',         // ruffles flicking
  settle: 'sine.inOut',
};

export let lenis: Lenis | null = null;

export function initScroll() {
  if (reduced) { document.documentElement.classList.add('is-reduced'); return; }
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 1.6, force: true });
  else window.scrollTo({ top: y, behavior: 'auto' });
}

export function scrollToEl(el: Element, offset = 0, immediate = false) {
  const y = el.getBoundingClientRect().top + scrollY + offset;
  scrollToY(y, immediate);
}

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

/** reveal a dashed (running-stitch) path by letting the stitches "pull through" */
export function prepStitch(path: SVGGeometryElement) {
  const L = path.getTotalLength();
  const cs = getComputedStyle(path).strokeDasharray.split(/[ ,]+/).map(parseFloat).filter((n) => !isNaN(n));
  const [a, b] = cs.length >= 2 ? cs : [3.2, 2.4];
  const n = Math.ceil(L / (a + b)) + 1;
  path.style.strokeDasharray = `${Array(n).fill(`${a} ${b}`).join(' ')} 0 ${L}`;
  path.style.strokeDashoffset = `${n * (a + b)}`;
  return { L, total: n * (a + b) };
}

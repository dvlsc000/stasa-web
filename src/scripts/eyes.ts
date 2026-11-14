import { gsap, reduced, finePointer, $$ } from './ctx';

/** one blink: the red lid drops and lifts */
export function blink(eye: Element, d = 0.08) {
  const lid = eye.querySelector('.eye__lid');
  const tl = gsap.timeline();
  if (!lid || reduced) return tl;
  return tl.to(lid, { '--lid': 1, duration: d, ease: 'power2.in' }).to(lid, { '--lid': 0, duration: d * 1.4, ease: 'power2.out' });
}

/** pupils that follow the pointer (the interlude eye, the header mark) */
const watchers: { eye: SVGSVGElement; pupil: SVGGElement }[] = [];
export function initEyes() {
  // eyes that open when they arrive
  for (const eye of $$<SVGSVGElement>('.interlude__eye .eye')) {
    const lid = eye.querySelector('.eye__lid')!;
    eye.classList.remove('is-closed');
    if (reduced) { gsap.set(lid, { '--lid': 0 }); continue; }
    gsap.set(lid, { '--lid': 1 });
    gsap.to(lid, { '--lid': 0, duration: 0.5, ease: 'expo.out', scrollTrigger: { trigger: eye, start: 'top 70%', once: true } });
  }
  for (const eye of $$<SVGSVGElement>('.interlude__eye .eye, .header__eye')) {
    watchers.push({ eye, pupil: eye.querySelector('.eye__pupil')! });
  }
  if (!reduced && finePointer) {
    addEventListener('pointermove', (e) => {
      for (const { eye, pupil } of watchers) {
        const r = eye.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const a = Math.atan2(e.clientY - cy, e.clientX - cx);
        const dist = Math.min(1, Math.hypot(e.clientX - cx, e.clientY - cy) / 400);
        pupil.style.transform = `translate(${(Math.cos(a) * 15 * dist).toFixed(1)}px, ${(Math.sin(a) * 6 * dist).toFixed(1)}px)`;
      }
    }, { passive: true });
  }
  // every eye on the page blinks now and then
  if (!reduced) {
    const all = () => $$('.header__eye, .interlude__eye .eye');
    const loop = () => {
      const list = all().filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
      if (list.length) blink(list[Math.floor(Math.random() * list.length)]);
      gsap.delayedCall(3.5 + Math.random() * 4, loop);
    };
    gsap.delayedCall(4, loop);
  }
}

import { gsap, ScrollTrigger, reduced, finePointer, scrollToY, $, $$ } from './ctx';

/** Wing II: a dense salon hang. On desktop the wall is bigger than the room and scroll pans across it, slightly downhill. */
let salonST: ScrollTrigger | null = null;
export function initSalon() {
  const section = $('.salon');
  const wall = $('[data-salon]');
  if (!section || !wall) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('salon--pan');
    const pin = $('.salon__pin', section)!;
    const dx = () => wall.scrollWidth - innerWidth;
    const dy = () => Math.max(0, wall.offsetHeight - innerHeight);
    const tw = gsap.to(wall, {
      x: () => -dx(), y: () => -dy(), ease: 'none',
      scrollTrigger: { trigger: pin, pin: true, start: 'top top', end: () => `+=${dx() * 1.05}`, scrub: 1.2, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    salonST = tw.scrollTrigger!;
    // keyboard: bring a focused frame into view
    const onFocus = (e: FocusEvent) => {
      const f = (e.target as HTMLElement).closest<HTMLElement>('.frame, .salon__title');
      if (!f || !salonST || document.body.dataset.restoring) return;
      pin.scrollLeft = 0; pin.scrollTop = 0;
      const x = f.getBoundingClientRect().left - wall.getBoundingClientRect().left;
      const p = gsap.utils.clamp(0, 1, (x - innerWidth * 0.3) / dx());
      scrollToY(salonST.start + p * (salonST.end - salonST.start) + 1, true);
    };
    section.addEventListener('focusin', onFocus);
    return () => { section.classList.remove('salon--pan'); section.removeEventListener('focusin', onFocus); salonST = null; };
  });

  // frames lift and lean toward the cursor (max 4°), casting a real shadow
  if (finePointer && !reduced) {
    const cursor = $('.cursor');
    for (const f of $$<HTMLElement>('.frame', section)) {
      const tilt = $('.frame__tilt', f)!;
      f.addEventListener('pointerenter', () => { f.classList.add('is-lifted'); cursor?.classList.add('is-wide'); });
      f.addEventListener('pointerleave', () => {
        f.classList.remove('is-lifted'); cursor?.classList.remove('is-wide');
        tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg');
      });
      f.addEventListener('pointermove', (e) => {
        const r = f.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
        tilt.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
      });
    }
  }
}

export function salonReveal(el: HTMLElement) {
  if (!salonST) return false;
  const wall = $('[data-salon]')!;
  const x = el.getBoundingClientRect().left - wall.getBoundingClientRect().left;
  const p = gsap.utils.clamp(0, 1, (x - innerWidth * 0.3) / (wall.scrollWidth - innerWidth));
  scrollToY(salonST.start + p * (salonST.end - salonST.start) + 1, true);
  return true;
}

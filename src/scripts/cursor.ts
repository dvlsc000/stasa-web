import { gsap, reduced, finePointer, $ } from './ctx';
import { blink } from './eyes';

/** Desktop only: a small red lashed eye. Over a piece it opens wide and says "View". */
export function initCursor() {
  const c = $('.cursor');
  if (!c || !finePointer) return;
  document.documentElement.classList.add('has-cursor');
  const eye = c.querySelector<SVGSVGElement>('.eye')!;
  const pupil = c.querySelector<SVGGElement>('.eye__pupil')!;
  const label = c.querySelector<HTMLElement>('.cursor__label')!;
  label.textContent = document.body.dataset.view ?? 'View';
  const dur = reduced ? 0 : 0.22;
  const xTo = gsap.quickTo(c, 'x', { duration: dur, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: dur, ease: 'power3' });
  let px = 0, py = 0;
  gsap.set(c, { x: -100, y: -100 });
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    xTo(e.clientX); yTo(e.clientY);
    const dx = gsap.utils.clamp(-14, 14, (e.clientX - px) * 0.8), dy = gsap.utils.clamp(-6, 6, (e.clientY - py) * 0.5);
    pupil.style.transform = `translate(${dx}px, ${dy}px)`;
    px = e.clientX; py = e.clientY;
    const t = (e.target as Element).closest?.('[data-cursor="view"]');
    c.classList.toggle('is-view', !!t);
    c.classList.remove('is-hidden');
  }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.add('is-hidden'));
  addEventListener('pointerdown', () => blink(eye, 0.06));
  // touch devices that also report a fine pointer: hide on first touch
  addEventListener('touchstart', () => { document.documentElement.classList.remove('has-cursor'); }, { once: true, passive: true });
}

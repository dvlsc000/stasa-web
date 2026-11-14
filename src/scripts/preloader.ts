import { gsap, lenis, $ } from './ctx';
import { signatureTween } from './thread';
import { blink } from './eyes';

/** ≤1.2s: the thread writes her name, a red eye opens at the end of the line and blinks once. */
export function runPreloader(): Promise<void> {
  const el = $('[data-preloader]');
  const html = document.documentElement;
  if (!el || html.classList.contains('no-preloader') || getComputedStyle(el).display === 'none') return Promise.resolve();
  try { sessionStorage.setItem('seen', '1'); } catch {}
  lenis?.stop();
  return new Promise((resolve) => {
    const sig = el.querySelector<SVGSVGElement>('.signature')!;
    const eye = el.querySelector<SVGSVGElement>('.preloader__eye')!;
    const lid = eye.querySelector('.eye__lid')!;
    eye.classList.remove('is-closed');
    const tl = gsap.timeline({
      onComplete: () => { el.remove(); lenis?.start(); resolve(); },
    });
    tl.add(signatureTween(sig, { duration: 0.58, ease: 'power1.inOut' }))
      .fromTo(lid, { '--lid': 1 }, { '--lid': 0, duration: 0.14, ease: 'power2.out' })
      .add(blink(eye, 0.07), '+=0.08')
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.32, ease: 'power3.inOut' }, '+=0.02');
    const skip = () => { tl.progress(1); off(); };
    const off = () => { removeEventListener('keydown', skip); el.removeEventListener('pointerdown', skip); };
    addEventListener('keydown', skip, { once: true });
    el.addEventListener('pointerdown', skip, { once: true });
  });
}

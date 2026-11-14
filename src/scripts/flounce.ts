import { gsap, reduced, $$ } from './ctx';

/** Horizontal flounces: the hem of the section above flicks up as you arrive, revealing the room. */
export function initFlounces() {
  if (reduced) return;
  for (const f of $$('.flounce--h')) {
    const tiers = $$('.flounce__tier', f);
    const host = f.parentElement!;
    gsap.timeline({ scrollTrigger: { trigger: host, start: 'top 92%', end: 'top 8%', scrub: 0.5 } })
      .fromTo(tiers, { scaleY: 1.18, skewX: -9, xPercent: -1.5 },
        { scaleY: 0.12, skewX: 7, xPercent: 1.5, stagger: 0.09, ease: 'power3.in', duration: 1 });
  }
}

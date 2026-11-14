import { gsap, ScrollTrigger, reduced, isDesktop, EASE, prepStitch, $, $$ } from './ctx';

/** The collage makes itself: wallpaper down, floor up, cut-outs drop in and are stitched on. */
export function heroIntro() {
  const hero = $('.hero');
  if (!hero) return;
  const wall = $('.hero__wall', hero), floor = $('.hero__floor', hero);
  const pieces = $$('.hero__piece-inner', hero);
  const appl = $('.appl', hero);
  if (reduced) return;

  const tl = gsap.timeline({ defaults: { ease: EASE.walk } });
  tl.from(wall, { yPercent: -100, duration: 0.9 }, 0)
    .from(floor, { yPercent: 100, duration: 0.9 }, 0.05)
    .from(appl, { scale: 1.35, rotation: -14, autoAlpha: 0, duration: 0.6, ease: EASE.drop }, 0.45);

  pieces.forEach((p, i) => {
    const rot = [-9, 7, -5, 11, -7][i % 5];
    const at = 0.35 + i * 0.13;
    tl.from(p, { y: -innerHeight * 0.55, rotation: rot, autoAlpha: 0, duration: 0.85, ease: EASE.drop }, at);
    for (const s of $$<SVGPathElement>('.art__stitch', p)) {
      const { total } = prepStitch(s);
      tl.fromTo(s, { strokeDashoffset: total }, { strokeDashoffset: 0, duration: 0.9, ease: 'power1.inOut' }, at + 0.55);
    }
  });
  return tl;
}

/** The one 3D moment: on scroll the layers part into a pop-up diorama, then fold back flat. */
export function heroDiorama() {
  const pin = $('.hero__pin');
  const stage = $('[data-stage]');
  if (!pin || !stage || reduced) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const layers = $$<HTMLElement>('.layer[data-z]', stage);
    const tl = gsap.timeline({
      defaults: { ease: 'sine.inOut' },
      scrollTrigger: { trigger: pin, start: 'top top', end: '+=110%', pin: true, scrub: 0.8, anticipatePin: 1 },
    });
    tl.to(stage, { rotationX: 9, rotationY: -17, scale: 0.84, duration: 1 }, 0);
    layers.forEach((l) => tl.to(l, { z: +l.dataset.z! * 2.1, duration: 1 }, 0));
    tl.to(stage, { rotationX: 0, rotationY: 0, scale: 1, duration: 1 }, 1.25);
    layers.forEach((l) => tl.to(l, { z: 0, duration: 1 }, 1.25));
    return () => tl.scrollTrigger?.kill();
  });
}

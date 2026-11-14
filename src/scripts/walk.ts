import { gsap, ScrollTrigger, reduced, EASE, prepStitch, scrollToY, $, $$ } from './ctx';

/**
 * Wing I. Scrolling is walking: the section pins and vertical scroll drives the salon sideways.
 * Below 768px, or with reduced motion, the rooms simply stack and pieces stitch on as they arrive.
 */
let walkST: ScrollTrigger | null = null;
let trackDistance = 0;
let trackEl: HTMLElement | null = null;

export function initWalk() {
  const section = $('.walk');
  const track = $('[data-walk-track]');
  if (!section || !track) return;
  trackEl = track;
  const mm = gsap.matchMedia();

  mm.add({ desk: '(min-width: 768px) and (prefers-reduced-motion: no-preference)', mob: '(max-width: 767px) and (prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { desk } = ctx.conditions as { desk: boolean };
    if (desk) return horizontal(section, track);
    vertical(section);
    return undefined;
  });
  if (reduced) section.classList.add('walk--still');
  initFocusFollow(section);
}

function pieceIn(piece: HTMLElement) {
  const art = $('.piece__art', piece)!;
  const label = $('.piece__label', piece);
  const stitches = $$<SVGPathElement>('.art__stitch', piece);
  const tl = gsap.timeline({ paused: true });
  const rot = gsap.utils.random(-10, 10, 1);
  tl.from(art, { y: -110, rotation: rot, opacity: 0, duration: 0.85, ease: EASE.drop });
  stitches.forEach((s) => {
    const { total } = prepStitch(s);
    tl.fromTo(s, { strokeDashoffset: total }, { strokeDashoffset: 0, duration: 0.9, ease: 'power1.inOut' }, 0.5);
  });
  if (label) tl.from(label, { xPercent: -45, yPercent: -25, rotation: -4, opacity: 0, duration: 0.5, ease: EASE.walk }, stitches.length ? 1.05 : 0.6);
  return tl;
}

function horizontal(section: HTMLElement, track: HTMLElement) {
  section.classList.add('walk--h');
  const pin = $('.walk__pin', section)!;
  const progress = $('[data-floor-progress]', section);
  const rooms = $$('.room', section);
  const links = $$<HTMLAnchorElement>('[data-room-link]', section);
  const dist = () => (trackDistance = track.scrollWidth - innerWidth);

  const tween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: pin, pin: true, start: 'top top', end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      onToggle: (st) => document.body.classList.toggle('is-walking', st.isActive),
      onUpdate: (st) => {
        if (progress) progress.style.transform = `scaleX(${st.progress})`;
        const x = st.progress * trackDistance + innerWidth * 0.5;
        let active = 0;
        rooms.forEach((r, i) => { if (r.offsetLeft <= x) active = i; });
        links.forEach((l, i) => (i === active ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
        sway(st.getVelocity());
      },
    },
  });
  walkST = tween.scrollTrigger!;

  // floor plan: place a manicule at each room's door
  const placeLinks = () => {
    const d = dist();
    rooms.forEach((r, i) => {
      const li = links[i]?.parentElement;
      if (li) li.style.left = `${gsap.utils.clamp(0, 100, ((r.offsetLeft - innerWidth * 0.08) / d) * 100)}%`;
    });
  };
  placeLinks();
  ScrollTrigger.addEventListener('refresh', placeLinks);
  links.forEach((a, i) => a.addEventListener('click', (e) => {
    e.preventDefault();
    goToX(rooms[i].offsetLeft + 2);
  }));

  // depth: far pieces drift against the walk, so the near ones feel close
  const pieces = $$<HTMLElement>('.piece', section);
  pieces.forEach((p) => {
    const d = +(p.dataset.depth ?? 0.5);
    const k = innerWidth * 0.13 * d;
    gsap.fromTo(p, { x: -k }, {
      x: k, ease: 'none',
      scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
    });
    const tl = pieceIn(p);
    ScrollTrigger.create({ trigger: p, containerAnimation: tween, start: 'left 88%', once: true, onEnter: () => tl.play() });
  });

  // room titles land like a card pinned to the wall
  for (const t of $$('.room__title', section)) {
    gsap.from(t, { y: -70, rotation: -7, opacity: 0, duration: 0.8, ease: EASE.drop,
      scrollTrigger: { trigger: t, containerAnimation: tween, start: 'left 80%', toggleActions: 'play none none none' } });
  }

  // between rooms: four ruffle tiers sweep across in a stagger — red, dots, paper, lace
  for (const f of $$('.walk__flounce', section)) {
    const tiers = $$('.flounce__tier', f);
    gsap.timeline({ scrollTrigger: { trigger: f, containerAnimation: tween, start: 'left 95%', end: 'left 20%', scrub: 0.4 } })
      .fromTo(tiers, { scaleX: 0.05, skewY: 10 }, { scaleX: 1, skewY: 0, stagger: 0.12, ease: 'expo.out', duration: 1 })
      .to(tiers, { skewY: -3, duration: 0.3, stagger: 0.06, ease: 'sine.out' }, '>-0.2')
      .to(tiers, { skewY: 0, duration: 0.4, stagger: 0.06, ease: 'sine.inOut' });
  }

  return () => {
    section.classList.remove('walk--h');
    document.body.classList.remove('is-walking');
    ScrollTrigger.removeEventListener('refresh', placeLinks);
    walkST = null;
  };
}

/** light, velocity-driven sway on hanging pieces, easing back to rest like fabric in still air */
const swayState = { s: 0 };
let swayTarget = 0;
function sway(v: number) {
  const target = gsap.utils.clamp(-2.6, 2.6, -v / 900);
  if (Math.abs(target - swayTarget) < 0.05) return;
  swayTarget = target;
  gsap.to(swayState, {
    s: target, duration: 0.5, ease: 'power2.out', overwrite: true,
    onUpdate: applySway,
    onComplete: () => { swayTarget = 0; gsap.to(swayState, { s: 0, duration: 1.6, ease: 'sine.inOut', onUpdate: applySway }); },
  });
}
function applySway() { trackEl?.style.setProperty('--sway', swayState.s.toFixed(3)); }

function vertical(section: HTMLElement) {
  for (const p of $$<HTMLElement>('.piece', section)) {
    const tl = pieceIn(p);
    ScrollTrigger.create({ trigger: p, start: 'top 85%', once: true, onEnter: () => tl.play() });
  }
}

/** scroll so that track position x sits near the left third of the screen */
export function goToX(x: number, immediate = false) {
  if (!walkST) return false;
  const p = gsap.utils.clamp(0, 1, (x - innerWidth * 0.06) / trackDistance);
  scrollToY(walkST.start + p * (walkST.end - walkST.start) + 1, immediate);
  return true;
}

/** keyboard: when focus moves to a piece inside the pinned walk, walk to it */
function initFocusFollow(section: HTMLElement) {
  section.addEventListener('focusin', (e) => {
    if (!walkST || !trackEl || document.body.dataset.restoring) return;
    const piece = (e.target as HTMLElement).closest<HTMLElement>('.piece, .room__title, .walk__intro');
    if (!piece) return;
    const pin = $('.walk__pin', section)!;
    pin.scrollLeft = 0;
    const x = piece.getBoundingClientRect().left - trackEl.getBoundingClientRect().left;
    goToX(x - innerWidth * 0.25, true);
  });
}

/** jump to a piece (from a hash or after closing a Plate) */
export function revealPiece(slug: string, immediate = true) {
  const el = document.getElementById(`piece-${slug}`);
  if (!el) return;
  if (walkST && trackEl && el.closest('.walk')) {
    const x = el.getBoundingClientRect().left - trackEl.getBoundingClientRect().left;
    goToX(x - innerWidth * 0.3, immediate);
  } else {
    scrollToY(el.getBoundingClientRect().top + scrollY - innerHeight * 0.2, immediate);
  }
}

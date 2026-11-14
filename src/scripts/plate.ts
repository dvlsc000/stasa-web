import { lenis, reduced, $, $$ } from './ctx';
import { prefill } from './form';
import { revealPiece } from './walk';

/**
 * The Plate. Each piece has its own page (/<lang>/work/<slug>/). On the home page,
 * clicking a piece fetches that page and shows its Plate in a dialog, with the URL updated
 * for sharing. Closing returns you to exactly where you were.
 */
const cache = new Map<string, Promise<HTMLElement | null>>();
let dialog: HTMLDialogElement | null = null;
let body: HTMLElement | null = null;
let opener: HTMLElement | null = null;
let homeURL = '';
let homeTitle = '';
let pushed = false;
let lang = 'hr';

function load(slug: string) {
  if (!cache.has(slug)) {
    cache.set(slug, fetch(`/${lang}/work/${slug}/`).then((r) => (r.ok ? r.text() : Promise.reject(r.status))).then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const art = doc.querySelector<HTMLElement>('.plate');
      if (!art) return null;
      const h = art.querySelector('h1');
      if (h) { const h2 = document.createElement('h2'); h2.className = h.className; h2.id = h.id; h2.innerHTML = h.innerHTML; h.replaceWith(h2); }
      return document.importNode(art, true) as HTMLElement;
    }).catch(() => { cache.delete(slug); return null; }));
  }
  return cache.get(slug)!;
}

async function show(slug: string, push: boolean) {
  const plate = await load(slug);
  if (!plate || !dialog || !body) { location.href = `/${lang}/work/${slug}/`; return; }
  body.replaceChildren(plate);
  body.scrollTop = 0;
  wirePlate(plate, true);
  const title = plate.querySelector('.plate__title')?.textContent ?? '';
  document.title = `${title} — Staša Čimbur`;
  dialog.setAttribute('aria-labelledby', plate.querySelector('.plate__title')!.id);
  if (!dialog.open) {
    dialog.showModal();
    lenis?.stop();
    dialog.classList.add('is-opening');
    setTimeout(() => dialog?.classList.remove('is-opening'), 700);
  }
  plate.querySelector<HTMLElement>('[data-plate-close]')?.focus({ preventScroll: true });
  const url = `/${lang}/work/${slug}/`;
  if (push) { history.pushState({ plate: slug }, '', url); pushed = true; }
  else if (location.pathname !== url) history.replaceState({ plate: slug }, '', url);
  // warm up the neighbours
  for (const a of $$<HTMLAnchorElement>('[data-plate-nav]', plate)) load(a.dataset.plateNav!);
}

function close(fromPop = false) {
  if (!dialog?.open) return;
  dialog.close();
  lenis?.start();
  document.title = homeTitle;
  if (!fromPop) {
    if (pushed) { pushed = false; history.back(); }
    else history.replaceState(null, '', homeURL);
  } else pushed = false;
  document.body.dataset.restoring = '1';
  opener?.focus({ preventScroll: true });
  requestAnimationFrame(() => delete document.body.dataset.restoring);
}

/** zoom, swipe and arrow keys — shared by the dialog and the standalone page */
export function wirePlate(plate: HTMLElement, inDialog: boolean) {
  const zoom = $('[data-zoom]', plate);
  const btn = $('[data-zoom-btn]', plate);
  const toggle = (e?: MouseEvent) => {
    if (!zoom) return;
    if (e) {
      const r = zoom.getBoundingClientRect();
      zoom.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
      zoom.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
    }
    const on = zoom.classList.toggle('is-zoomed');
    btn?.setAttribute('aria-pressed', String(on));
  };
  btn?.addEventListener('click', () => toggle());
  zoom?.addEventListener('dblclick', (e) => toggle(e));
  zoom?.addEventListener('click', (e) => { if (zoom.classList.contains('is-zoomed')) toggle(e); });
  zoom?.addEventListener('pointermove', (e) => {
    if (!zoom.classList.contains('is-zoomed') || e.pointerType !== 'mouse') return;
    const r = zoom.getBoundingClientRect();
    zoom.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    zoom.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  });

  // swipe left/right for previous/next
  let sx = 0, sy = 0;
  plate.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  plate.addEventListener('touchend', (e) => {
    if (zoom?.classList.contains('is-zoomed') || e.touches.length) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) $<HTMLAnchorElement>(dx < 0 ? '.plate__next' : '.plate__prev', plate)?.click();
  }, { passive: true });

  if (inDialog) {
    for (const a of $$<HTMLAnchorElement>('[data-plate-nav]', plate)) a.addEventListener('click', (e) => { e.preventDefault(); show(a.dataset.plateNav!, false); });
    $('[data-plate-close]', plate)?.addEventListener('click', (e) => { e.preventDefault(); close(); });
    $('[data-enquire]', plate)?.addEventListener('click', (e) => {
      e.preventDefault();
      const id = (e.currentTarget as HTMLElement).dataset.enquire!;
      const title = plate.querySelector('.plate__title')?.textContent ?? '';
      opener = null;
      close();
      setTimeout(() => prefill(id, title, true), 60);
    });
  }
}

export function initPlate() {
  lang = document.documentElement.lang;
  const standalone = $('.workpage .plate');
  if (standalone) {
    wirePlate(standalone, false);
    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') $<HTMLAnchorElement>('.plate__next')?.click();
      if (e.key === 'ArrowLeft') $<HTMLAnchorElement>('.plate__prev')?.click();
    });
    return;
  }
  dialog = $<HTMLDialogElement>('[data-plate-dialog]');
  body = $('[data-plate-body]');
  if (!dialog || !body) return;
  homeURL = location.pathname + location.search + location.hash;
  homeTitle = document.title;

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-plate]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e as MouseEvent).button) return;
    e.preventDefault();
    opener = a;
    homeURL = location.pathname + location.search + location.hash;
    show(a.dataset.plate!, true);
  });
  // warm the cache on intent
  document.addEventListener('pointerover', (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[data-plate]');
    if (a) load(a.dataset.plate!);
  }, { passive: true });

  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') $<HTMLAnchorElement>('.plate__next', dialog!)?.click();
    if (e.key === 'ArrowLeft') $<HTMLAnchorElement>('.plate__prev', dialog!)?.click();
  });
  addEventListener('popstate', (e) => {
    const m = location.pathname.match(/\/work\/([^/]+)\/?$/);
    if (m) show(m[1], false);
    else if (dialog?.open) close(true);
  });
  if (reduced) dialog.classList.add('is-reduced');

  // arriving from a Plate page's close link: /<lang>/#piece-<slug>
  const h = location.hash.match(/^#piece-(.+)$/);
  if (h) requestAnimationFrame(() => revealPiece(h[1]));
}

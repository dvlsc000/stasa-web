import { ScrollTrigger, scrollToY, $$ } from './ctx';

/** Switching language keeps your place: we remember how far down you were and return there. */
export function initLang() {
  for (const a of $$<HTMLAnchorElement>('[data-lang-link]')) {
    a.addEventListener('click', () => {
      try { sessionStorage.setItem('langPos', JSON.stringify({ y: scrollY, h: document.documentElement.scrollHeight })); } catch {}
    });
  }
}

export function restoreLangPos() {
  let pos: { y: number; h: number } | null = null;
  try { pos = JSON.parse(sessionStorage.getItem('langPos') ?? 'null'); sessionStorage.removeItem('langPos'); } catch {}
  if (!pos || location.hash) return;
  const go = () => {
    const ratio = document.documentElement.scrollHeight / pos!.h;
    scrollToY(Math.round(pos!.y * (Math.abs(ratio - 1) < 0.08 ? 1 : ratio)), true);
  };
  ScrollTrigger.addEventListener('refresh', function once() { ScrollTrigger.removeEventListener('refresh', once); requestAnimationFrame(go); });
  go();
}

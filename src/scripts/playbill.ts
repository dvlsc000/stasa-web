import { gsap, reduced, finePointer, $, $$ } from './ctx';

/** The playbill: a small stitched swatch follows the cursor over each row. */
export function initPlaybill() {
  const table = $('.playbill__table');
  const float = $('.playbill__float');
  if (!table || !float || !finePointer || reduced) return;
  const xTo = gsap.quickTo(float, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(float, 'y', { duration: 0.45, ease: 'power3' });
  const rTo = gsap.quickTo(float, 'rotation', { duration: 0.6, ease: 'power3' });
  let lastX = 0;
  let shown = false;
  for (const tr of $$<HTMLTableRowElement>('tbody tr', table)) {
    tr.addEventListener('pointerenter', () => {
      float.className = `playbill__float cut-${1 + (tr.rowIndex % 6)} pat-${tr.dataset.swatch}`;
      if (!shown) gsap.to(float, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power2.out' });
      shown = true;
    });
  }
  table.addEventListener('pointerleave', () => { shown = false; gsap.to(float, { autoAlpha: 0, scale: 0.9, duration: 0.2 }); });
  table.addEventListener('pointermove', (e) => {
    xTo(e.clientX + 28); yTo(e.clientY - 70); rTo(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.6)); lastX = e.clientX;
  });
}

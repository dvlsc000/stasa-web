import { gsap, ScrollTrigger, reduced, $$ } from './ctx';

type Pt = [number, number] | [string, number, number];
/** Resolves the thread's waypoints to pixels inside its host and draws a smooth curve through them. */
function build(points: Pt[], host: HTMLElement) {
  const hr = host.getBoundingClientRect();
  const w = host.offsetWidth, h = host.offsetHeight;
  const sx = w / (hr.width || 1), sy = h / (hr.height || 1);
  const pts = points.map((p) => {
    if (typeof p[0] === 'string') {
      const el = host.querySelector(p[0] as string);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [(r.left - hr.left + r.width * (p[1] as number)) * sx, (r.top - hr.top + r.height * (p[2] as number)) * sy];
    }
    return [(p[0] as number) * w, (p[1] as number) * h];
  }).filter(Boolean) as number[][];
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

let uid = 0;
export function initThreads() {
  for (const svg of $$<SVGSVGElement>('svg.thread[data-thread]')) {
    const line = svg.querySelector<SVGPathElement>('.thread__line')!;
    const reveal = svg.querySelector<SVGPathElement>('.thread__reveal')!;
    const mask = svg.querySelector('mask')!;
    mask.id = `thread-mask-${++uid}`;
    line.setAttribute('mask', `url(#${mask.id})`);
    const host = svg.parentElement!;
    const layout = () => {
      const w = host.offsetWidth, h = host.offsetHeight;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const d = build(JSON.parse(svg.dataset.thread!), host);
      line.setAttribute('d', d); reveal.setAttribute('d', d);
      const L = reveal.getTotalLength();
      reveal.style.strokeDasharray = `${L} ${L}`;
      return L;
    };
    let L = layout();
    if (reduced) { reveal.style.strokeDashoffset = '0'; continue; }
    const state = { p: 0 };
    const apply = () => (reveal.style.strokeDashoffset = `${L * (1 - state.p)}`);
    apply();
    ScrollTrigger.create({
      trigger: host, start: 'top 85%', end: 'bottom 65%', scrub: 0.6,
      onUpdate: (st) => { state.p = st.progress; apply(); },
      onRefreshInit: () => { L = layout(); apply(); },
    });
  }
}

/** a signature written by the thread; returns a tween you can play or scrub */
export function signatureTween(svg: SVGSVGElement, opts: gsap.TweenVars = {}) {
  const r = svg.querySelector<SVGPathElement>('.signature__reveal')!;
  return gsap.fromTo(r, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', ...opts });
}

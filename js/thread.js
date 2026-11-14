/* Thread: thin, slightly nervous hand-drawn lines (after Staša's stitched wire drawings),
   plus the printed eye textures. Everything is generated, so it stays crisp and light. */
(function () {
  // seeded random so every drawing is stable between visits
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  // Catmull-Rom densify, then add a low-frequency tremor along the normal
  function wobble(points, seed, amp = 0.7, steps = 7) {
    const r = rng(seed);
    const p1 = r() * 6.28, p2 = r() * 6.28, f1 = 0.9 + r() * 0.8, f2 = 2.3 + r() * 1.5;
    const pts = [];
    const P = points;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], a = P[i], b = P[i + 1], p3 = P[i + 2] || b;
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        const x = 0.5 * ((2 * a[0]) + (-p0[0] + b[0]) * t + (2 * p0[0] - 5 * a[0] + 4 * b[0] - p3[0]) * t2 + (-p0[0] + 3 * a[0] - 3 * b[0] + p3[0]) * t3);
        const y = 0.5 * ((2 * a[1]) + (-p0[1] + b[1]) * t + (2 * p0[1] - 5 * a[1] + 4 * b[1] - p3[1]) * t2 + (-p0[1] + 3 * a[1] - 3 * b[1] + p3[1]) * t3);
        pts.push([x, y]);
      }
    }
    pts.push(P[P.length - 1]);
    let d = "";
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
      let nx = -(next[1] - prev[1]), ny = next[0] - prev[0];
      const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      const k = i / pts.length * 6.28;
      const off = amp * (Math.sin(k * f1 * 3 + p1) * 0.6 + Math.sin(k * f2 * 3 + p2) * 0.4) + (r() - 0.5) * amp * 0.25;
      const x = pts[i][0] + nx * off, y = pts[i][1] + ny * off;
      d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }
    return d;
  }

  function ellipse(cx, cy, rx, ry, n = 16, rot = 0, start = 0, sweep = 1) {
    const out = []; const c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i <= n; i++) {
      const a = (start + sweep * i / n) * Math.PI * 2;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      out.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return out;
  }

  // Drawings: viewBox + strokes (each stroke is a list of points)
  const D = {
    hat: { vb: "0 0 100 62", s: [
      ellipse(50, 44, 47, 10, 18, -0.03),
      [[24, 42], [23, 30], [27, 17], [38, 9], [52, 7], [64, 10], [73, 18], [76, 30], [75, 42]],
      [[23, 33], [50, 37], [76, 33]],
      [[64, 35], [70, 27], [78, 31], [71, 37], [66, 36]]
    ]},
    headpiece: { vb: "0 0 100 72", s: [
      ellipse(42, 50, 27, 10, 16, -0.2),
      [[48, 46], [57, 32], [70, 20], [84, 10], [97, 6]],
      [[52, 48], [62, 36], [76, 24], [92, 14]],
      [[18, 54], [24, 66], [31, 56], [38, 68], [46, 58]]
    ]},
    bag: { vb: "0 0 100 82", s: [
      [[14, 34], [86, 34], [80, 78], [20, 78], [14, 34]],
      [[14, 34], [50, 52], [86, 34]],
      [[30, 34], [31, 16], [50, 6], [69, 16], [70, 34]],
      ellipse(50, 53, 3, 3, 8)
    ]},
    parasol: { vb: "0 0 100 92", s: [
      [[4, 40], [14, 22], [30, 10], [50, 6], [70, 10], [86, 22], [96, 40]],
      [[96, 40], [88, 46], [80, 40], [72, 46], [64, 40], [56, 46], [48, 40], [40, 46], [32, 40], [24, 46], [16, 40], [8, 46], [4, 40]],
      [[50, 6], [50, 41]], [[50, 6], [30, 41]], [[50, 6], [72, 41]],
      [[50, 41], [50, 80], [52, 87], [58, 89], [62, 84]]
    ]},
    scarf: { vb: "0 0 100 82", s: [
      [[10, 14], [40, 9], [70, 16], [92, 10]],
      [[10, 14], [15, 40], [8, 70]],
      [[92, 10], [86, 40], [94, 68]],
      [[8, 70], [30, 62], [50, 73], [72, 62], [94, 68]],
      [[44, 30], [52, 24], [60, 31], [52, 37], [44, 30], [38, 50]]
    ]},
    dress: { vb: "0 0 80 100", s: [
      [[30, 8], [34, 3], [46, 3], [50, 8], [52, 30], [28, 30], [30, 8]],
      [[28, 30], [17, 58], [7, 88]],
      [[52, 30], [63, 58], [73, 88]],
      [[7, 88], [12, 93], [18, 88], [24, 93], [30, 88], [36, 93], [42, 88], [48, 93], [54, 88], [60, 93], [66, 88], [73, 88]],
      [[13, 70], [24, 66], [40, 70], [56, 66], [67, 70]]
    ]},
    frame: { vb: "0 0 80 100", s: [
      [[4, 4], [76, 4], [76, 96], [4, 96], [4, 4]],
      [[14, 14], [66, 14], [66, 86], [14, 86], [14, 14]]
    ]},
    shoe: { vb: "0 0 100 72", s: [
      [[4, 56], [14, 59], [30, 58], [42, 52], [56, 42], [70, 34], [80, 31], [82, 36], [84, 66], [88, 66], [89, 34], [93, 24], [92, 14], [84, 13], [76, 20], [62, 30], [44, 40], [26, 44], [10, 47], [4, 52], [4, 56]],
      [[76, 20], [72, 8], [80, 4], [86, 9], [84, 13]],
      [[20, 45], [22, 54]]
    ]},
    eye: { vb: "0 0 100 50", s: [
      [[4, 30], [20, 17], [50, 11], [80, 17], [96, 30]],
      [[4, 30], [24, 41], [50, 45], [76, 41], [96, 30]],
      ellipse(50, 29, 12, 12, 14),
      [[16, 20], [10, 10]], [[28, 15], [25, 4]], [[40, 12], [39, 1]], [[52, 11], [53, 0]], [[64, 12], [67, 2]], [[76, 15], [81, 6]], [[86, 20], [93, 12]]
    ]},
    arrow: { vb: "0 0 100 30", s: [ [[2, 16], [30, 13], [60, 17], [96, 14]], [[84, 6], [96, 14], [85, 23]] ] },
    arrowDown: { vb: "0 0 30 100", s: [ [[15, 2], [13, 40], [17, 70], [15, 96]], [[6, 84], [15, 96], [24, 84]] ] },
    arrowLeft: { vb: "0 0 100 30", s: [ [[98, 15], [70, 18], [40, 13], [4, 16]], [[16, 7], [4, 16], [15, 24]] ] },
    close: { vb: "0 0 100 100", s: [ [[10, 12], [50, 50], [90, 88]], [[90, 10], [50, 52], [12, 90]] ] },
    underline: { vb: "0 0 300 12", s: [ [[2, 7], [80, 5], [160, 8], [240, 5], [298, 7]] ] },
    lineLong: { vb: "0 0 600 40", s: [ [[2, 30], [120, 22], [260, 28], [400, 16], [520, 18], [598, 6]] ] }
  };

  function draw(svg, name, opts = {}) {
    const def = D[name]; if (!def) return;
    svg.setAttribute("viewBox", def.vb);
    if (!svg.hasAttribute("aria-hidden")) svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    const seed = hash((opts.seed || svg.dataset.seed || name) + "");
    const amp = parseFloat(svg.dataset.amp || opts.amp || 0.7);
    const doubled = svg.dataset.double !== "no";
    let html = "";
    def.s.forEach((stroke, i) => {
      html += `<path class="t-line" d="${wobble(stroke, seed + i * 97, amp)}"/>`;
      if (doubled && i % 2 === 0) html += `<path class="t-line t-ghost" d="${wobble(stroke, seed + i * 131 + 7, amp * 1.4)}"/>`;
    });
    svg.innerHTML = html;
  }

  function drawAll(root = document) {
    root.querySelectorAll("svg[data-draw]").forEach(s => draw(s, s.dataset.draw));
  }

  /* ---------- Printed eye (after the eye prints in her collages) ---------- */
  function bez(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]];
  }
  let clipN = 0;
  function printedEye(cx, cy, sc, rot, fg, bg, seed) {
    const r = rng(seed), id = "c" + (clipN++);
    const U = [[-42, 3], [-26, -17], [22, -19], [42, -2]];   // upper lid
    const L = [[-42, 3], [-20, 16], [22, 16], [42, -2]];     // lower lid
    let lashes = "";
    for (let i = 0; i < 15; i++) {
      const t = 0.08 + i * 0.062, p = bez(...U, t), q = bez(...U, Math.min(1, t + .01));
      let nx = (q[1] - p[1]), ny = -(q[0] - p[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      if (ny > 0) { nx = -nx; ny = -ny; }
      const len = 9 + 9 * Math.pow(t, 1.4) + r() * 3, sweep = 4 + 10 * t;
      const ex = p[0] + nx * len + sweep, ey = p[1] + ny * len;
      lashes += `<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)} Q${(p[0] + nx * len * .55 + sweep * .1).toFixed(1)} ${(p[1] + ny * len * .7).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke-width="${(1.6 - t * .5).toFixed(2)}"/>`;
    }
    for (let i = 0; i < 7; i++) {
      const t = 0.25 + i * 0.09, p = bez(...L, t);
      lashes += `<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)} l${(1 + t * 3).toFixed(1)} ${(4 + r() * 2).toFixed(1)}" stroke-width=".9"/>`;
    }
    let radial = "";
    for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283; radial += `<path d="M${(2 + Math.cos(a) * 5).toFixed(1)} ${(-1 + Math.sin(a) * 5).toFixed(1)} L${(2 + Math.cos(a) * 11.5).toFixed(1)} ${(-1 + Math.sin(a) * 11.5).toFixed(1)}" stroke-width=".8"/>`; }
    const shape = `M-42 3 C-26 -17 22 -19 42 -2 C22 16 -20 16 -42 3Z`;
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${sc})">
      <defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
      <path d="${shape}" fill="${bg}"/>
      <g clip-path="url(#${id})" stroke="${fg}" fill="none">
        <circle cx="2" cy="-1" r="12.5" stroke-width="1.6"/>${radial}
        <circle cx="2" cy="-1" r="4.8" fill="${fg}" stroke="none"/>
        <circle cx="5.5" cy="-4.5" r="1.8" fill="${bg}" stroke="none"/>
        <path d="M-42 3 C-26 -13 22 -15 42 -2" stroke-width="5" opacity=".18"/>
      </g>
      <g stroke="${fg}" fill="none" stroke-linecap="round">
        <path d="M-42 3 C-26 -17 22 -19 42 -2" stroke-width="3.6"/>
        <path d="M-35 -9 C-18 -26 16 -27 37 -12" stroke-width="1.3"/>
        <path d="M-41 4 C-20 16 22 16 40 -1" stroke-width="1.5"/>
        ${lashes}
      </g></g>`;
  }
  function eyeTile({ bg, fg, w = 220, h = 170, seed = 1 }) {
    const r = rng(seed);
    const e = (x, y, s, ro) => printedEye(x, y, s, ro, fg, bg, seed * 31 + Math.round(x + y));
    const body = e(w * .28, h * .34, .95 + r() * .08, -7) + e(w * .78, h * .84, .9, 6) + e(w * .78 - w, h * .84, .9, 6) + e(w * .28, h * .34 + h, .95, -7);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  /* Eye print in a cotton band beside a black band (Platinum) */
  function eyesBandTile({ cotton, ink, fg, w = 150, band = 26, h = 200, seed = 21 }) {
    const cw = w - band;
    const body = printedEye(cw * .5, h * .24, .95, -5, fg, cotton, seed) + printedEye(cw * .5, h * .74, .95, 4, fg, cotton, seed + 3);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${cotton}"/>${body}<rect x="${cw}" width="${band}" height="${h}" fill="${ink}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  /* ---------- Lips print (Platinum, Embrace, Under lace) ---------- */
  function lipsTile({ bg, fg, w = 190, h = 150, seed = 6 }) {
    const r = rng(seed);
    const lips = (cx, cy, sc, rot) => {
      const speck = Array.from({ length: 7 }, () => `<circle cx="${((r() - .5) * 44).toFixed(1)}" cy="${((r() - .5) * 16).toFixed(1)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="${bg}" opacity=".85"/>`).join("");
      return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${sc})">
        <path d="M-30 0 C-22 -6 -14 -14 -6 -12 C-3 -11 -1 -9 0 -8 C1 -9 3 -11 6 -12 C14 -14 22 -6 30 0 C20 2 10 1 0 2 C-10 1 -20 2 -30 0Z" fill="${fg}"/>
        <path d="M-30 0 C-20 4 -10 4 0 4 C10 4 20 4 30 0 C24 12 12 17 0 17 C-12 17 -24 12 -30 0Z" fill="${fg}"/>
        <path d="M-27 1.5 C-15 4.5 15 4.5 27 1.5" stroke="${bg}" stroke-width="1.6" fill="none" opacity=".9"/>
        <path d="M-12 9 C-6 12 6 12 12 9" stroke="${bg}" stroke-width="1.1" fill="none" opacity=".5"/>
        ${speck}</g>`;
    };
    const a = lips(w * .26, h * .3, 0.95, -10 + r() * 6), b = lips(w * .76, h * .78, 0.9, 8 + r() * 8);
    const b2 = lips(w * .76 - w, h * .78, 0.9, 12), a2 = lips(w * .26, h * .3 + h, 0.95, -8);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${a}${b}${b2}${a2}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  /* Lips in a cotton band between red satin and black pinstripes (Embrace) */
  function lipsBandTile({ cotton, ink, red, w = 170, h = 150, seed = 17 }) {
    const inner = lipsTile({ bg: cotton, fg: red, w: 120, h, seed });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="${w}" height="${h}" fill="${cotton}"/>
      <image href="${inner.slice(5, -2)}" x="0" y="0" width="120" height="${h}"/>
      <rect x="120" width="5" height="${h}" fill="${ink}"/><rect x="129" width="26" height="${h}" fill="${red}"/>
      <rect x="138" width="4" height="${h}" fill="#e2414a" opacity=".7"/><rect x="159" width="5" height="${h}" fill="${ink}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  /* ---------- Faint white lashes on cotton (Embrace) ---------- */
  function lashesTile({ bg, fg, w = 220, h = 170 }) {
    const eye = (cx, cy, rot) => `<g transform="translate(${cx} ${cy}) rotate(${rot})" stroke="${fg}" stroke-width="2.2" stroke-linecap="round" fill="none">
      <path d="M-26 0 Q0 12 26 0"/><path d="M-20 4 l-4 7 M-12 7 l-2 8 M-4 8 v8 M4 8 l1 8 M12 7 l3 8 M20 4 l5 7"/></g>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${eye(w * .28, h * .3, -6)}${eye(w * .78, h * .78, 7)}${eye(w * .78 - w, h * .78, 7)}${eye(w * .28, h * .3 + h, -6)}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  function lace(color) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="16" viewBox="0 0 28 16"><path d="M0 0H28V6Q21 16 14 6Q7 16 0 6Z" fill="${color}"/><circle cx="7" cy="7.6" r="1.6" fill="#111010"/><circle cx="21" cy="7.6" r="1.6" fill="#111010"/><circle cx="14" cy="3" r="1" fill="#111010"/><circle cx="0" cy="3" r="1" fill="#111010"/><circle cx="28" cy="3" r="1" fill="#111010"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  function installTextures() {
    const cs = getComputedStyle(document.documentElement);
    const ink = cs.getPropertyValue("--ink").trim() || "#111010";
    const cotton = cs.getPropertyValue("--cotton").trim() || "#EEE9DF";
    const red = cs.getPropertyValue("--red").trim() || "#C8161E";
    const root = document.documentElement.style;
    root.setProperty("--tex-eyes-ink", eyeTile({ bg: ink, fg: "#D6D0C3", iris: ink, seed: 3 }));
    root.setProperty("--tex-eyes-red", eyeTile({ bg: cotton, fg: red, iris: cotton, seed: 9, w: 200, h: 160 }));
    root.setProperty("--tex-lace", lace(cotton));
    root.setProperty("--tex-eyes-stripes", eyesBandTile({ cotton, ink, fg: red }));
    root.setProperty("--tex-lips-stripes", lipsBandTile({ cotton, ink, red }));
    root.setProperty("--tex-lips-red", lipsTile({ bg: cotton, fg: red, seed: 6 }));
    root.setProperty("--tex-lips-ink", lipsTile({ bg: cotton, fg: ink, seed: 11, w: 170, h: 136 }));
    root.setProperty("--tex-lashes", lashesTile({ bg: cotton, fg: "#F8F5EF" }));
  }

  window.Thread = { draw, drawAll, wobble, installTextures };
})();

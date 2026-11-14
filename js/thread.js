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

  /* ---------- Printed eye texture (tile) ---------- */
  function eyeTile({ bg, fg, iris, w = 220, h = 170, seed = 1 }) {
    const r = rng(seed);
    const eye = (cx, cy, sc, rot) => {
      const lashes = [[-30, -6, -36, -20], [-20, -11, -24, -26], [-8, -14, -9, -30], [4, -14, 5, -31], [16, -12, 20, -28], [27, -8, 34, -22], [34, -3, 42, -14]]
        .map(l => `<path d="M${l[0]} ${l[1]} Q${(l[0] + l[2]) / 2 + 1} ${(l[1] + l[3]) / 2} ${l[2]} ${l[3]}" stroke="${fg}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`).join("");
      return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${sc})">
        <path d="M-40 0 Q-18 -18 0 -16 Q22 -16 40 -2 Q20 14 0 14 Q-22 14 -40 0Z" fill="${fg}"/>
        <circle cx="2" cy="-1" r="10.5" fill="${iris}"/>
        <circle cx="2" cy="-1" r="4.6" fill="${fg}" opacity=".9"/>
        <path d="M-40 0 Q-18 -18 0 -16 Q22 -16 40 -2" stroke="${iris}" stroke-width="3.2" fill="none"/>
        ${lashes}</g>`;
    };
    const a = eye(w * 0.27, h * 0.33, 0.95 + r() * 0.1, -8 + r() * 6);
    const b = eye(w * 0.77, h * 0.83, 0.9 + r() * 0.12, 6 + r() * 6);
    const b2 = eye(w * 0.77 - w, h * 0.83, 0.9, 8); // wrap
    const a2 = eye(w * 0.27, h * 0.33 + h, 0.95, -6);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${a}${b}${b2}${a2}</svg>`;
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
  }

  window.Thread = { draw, drawAll, wobble, installTextures };
})();

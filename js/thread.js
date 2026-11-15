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

  /* ---------- Line drawings ----------
     Drawn by hand as smooth curves, after the stitched wire drawings in her work
     (shoes, heels and hats drawn in one thin black line over the print).
     Each drawing: a viewBox and its strokes, in the order the needle sews them. */
  const D = {
    shoe: { vb: "0 0 300 180", s: [
      "M18 150 C40 158 82 161 112 156 C150 150 192 122 232 93 C244 86 256 85 262 92 C263 118 259 146 257 166 L265 166 C267 140 272 112 277 89 C281 71 277 53 264 47 C240 52 202 74 168 92 C132 110 92 119 60 124 C36 128 15 136 14 146 C14 149 16 150 18 150",
      "M64 129 C120 124 196 99 250 82",
      "M264 47 C268 40 276 38 282 42"
    ]},
    hat: { vb: "0 0 300 170", s: [
      "M12 116 C30 142 128 156 200 146 C252 139 294 124 290 106 C287 93 262 90 242 95 C206 104 128 110 74 105 C34 101 2 102 12 116",
      "M90 104 C84 74 94 42 132 33 C168 25 202 36 207 60 C211 76 209 90 205 101",
      "M90 92 C128 101 172 99 206 88",
      "M200 90 C214 70 240 66 237 82 C234 95 214 95 203 91 C219 98 232 112 219 119 C207 124 199 108 201 93"
    ]},
    headpiece: { vb: "0 0 300 200", s: [
      "M40 150 C40 120 120 100 170 112 C214 122 220 150 180 162 C130 176 40 176 40 150",
      "M80 146 C96 128 150 124 168 140",
      "M150 118 C170 80 214 40 286 16",
      "M176 96 C188 90 202 92 210 100 M196 72 C210 66 224 68 232 76 M220 50 C234 44 248 46 256 54",
      "M118 112 C108 72 82 50 58 40 M52 40 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0"
    ]},
    bag: { vb: "0 0 260 220", s: [
      "M76 94 C70 40 104 14 130 14 C156 14 190 40 184 94",
      "M40 96 C36 140 44 186 56 200 C100 210 160 210 204 200 C216 186 224 140 220 96 C170 90 90 90 40 96",
      "M40 96 C80 130 112 142 130 142 C148 142 180 130 220 96",
      "M124 142 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0"
    ]},
    parasol: { vb: "0 0 280 260", s: [
      "M140 6 L140 18 C190 18 250 50 266 106 C254 118 238 118 230 104 C218 118 196 118 186 104 C172 118 152 118 140 104 C128 118 108 118 94 104 C84 118 62 118 50 104 C42 118 26 118 14 106 C30 50 90 18 140 18",
      "M140 18 C120 50 102 80 94 104 M140 18 C160 50 178 80 186 104 M140 18 L140 104",
      "M140 104 L140 222 C140 244 160 248 168 236 C172 228 166 222 160 226"
    ]},
    scarf: { vb: "0 0 280 200", s: [
      "M20 60 C70 30 130 50 150 80 C170 110 230 120 262 96 C254 120 258 150 262 170 C240 186 210 180 190 160 C170 140 140 160 100 150 C60 140 30 100 20 60",
      "M140 92 C150 80 168 84 166 98 C164 112 146 110 140 100",
      "M60 74 C90 70 120 84 136 100 M200 132 C220 138 240 134 258 128"
    ]},
    dress: { vb: "0 0 220 300", s: [
      "M84 14 C84 32 82 46 80 60 C78 80 84 96 90 106 C70 160 40 220 18 262 C30 276 44 276 52 264 C62 278 80 278 88 266 C98 280 118 280 126 266 C136 280 156 280 164 266 C174 278 192 278 202 262 C180 220 150 160 130 106 C136 96 142 80 140 60 C138 46 136 32 136 14",
      "M84 14 C96 40 124 40 136 14",
      "M90 106 C104 114 118 114 130 106",
      "M42 200 C56 210 72 210 82 202 C96 212 120 212 134 202 C146 210 164 210 178 200"
    ]},
    eye: { vb: "0 0 200 110", s: [
      "M10 62 C50 24 150 20 190 56 C140 92 60 94 10 62",
      "M76 58 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0 M93 58 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0",
      "M34 42 C28 30 24 24 16 20 M56 31 C52 18 50 12 44 6 M82 26 C80 14 80 8 76 2 M110 25 C112 13 114 7 118 2 M136 29 C142 17 146 12 152 7 M160 38 C168 28 174 24 182 21"
    ]},
    frame: { vb: "0 0 200 250", s: [ "M10 10 L190 10 L190 240 L10 240 Z", "M30 30 L170 30 L170 220 L30 220 Z" ] },
    arrow: { vb: "0 0 100 30", s: [ "M4 16 C40 12 70 18 96 14", "M84 6 L97 14 L85 23" ] },
    arrowLeft: { vb: "0 0 100 30", s: [ "M96 16 C60 12 30 18 4 14", "M16 6 L3 14 L15 23" ] },
    arrowDown: { vb: "0 0 30 100", s: [ "M15 2 C12 40 18 70 15 96", "M6 84 L15 97 L24 84" ] },
    arrowUp: { vb: "0 0 30 100", s: [ "M15 98 C18 60 12 30 15 4", "M6 16 L15 3 L24 16" ] },
    close: { vb: "0 0 100 100", s: [ "M12 12 C40 42 62 60 88 88", "M88 12 C60 40 42 62 12 88" ] },
    underline: { vb: "0 0 300 18", s: [ "M2 9 C80 4 160 12 232 7 C252 6 266 2 270 6 C274 11 262 15 258 10 C255 6 266 3 298 8" ] },
    lineLong: { vb: "0 0 600 40", s: [ "M2 30 C140 20 260 34 380 20 C410 16 426 6 418 3 C408 0 402 14 420 17 C462 22 520 12 598 8" ] }
  };
  const ANIMATED = new Set(["shoe", "hat", "headpiece", "bag", "parasol", "scarf", "dress", "eye", "lineLong", "underline"]);

  function draw(svg, name) {
    const def = D[name]; if (!def) return;
    svg.setAttribute("viewBox", def.vb);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    svg.innerHTML = def.s.map(d => `<path class="t-line" d="${d}"/>`).join("");
    if (ANIMATED.has(name)) svg.dataset.sew = "";
  }

  function drawAll(root = document) {
    root.querySelectorAll("svg[data-draw]").forEach(s => draw(s, s.dataset.draw));
  }

  /* ---------- Sewing animation: a red needle runs ahead of the thread ---------- */
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function sew(svg) {
    if (svg.dataset.sewn) return; svg.dataset.sewn = "1";
    const paths = Array.from(svg.querySelectorAll(".t-line"));
    const lens = paths.map(p => p.getTotalLength());
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    const vb = svg.viewBox.baseVal;
    const unit = Math.max(vb.width, vb.height);
    paths.forEach(p => { p.setAttribute("pathLength", "1"); p.style.strokeDasharray = "1 1"; p.style.strokeDashoffset = "1"; });
    const ns = "http://www.w3.org/2000/svg";
    const needle = document.createElementNS(ns, "g"); needle.setAttribute("class", "t-needle");
    needle.innerHTML = `<line x1="0" y1="0" x2="${(unit * .055).toFixed(1)}" y2="${(-unit * .02).toFixed(1)}"/><circle r="${(unit * .009 + 1).toFixed(1)}"/>`;
    svg.appendChild(needle);
    const dur = Math.min(3200, 900 + total / unit * 650);
    const t0 = performance.now();
    (function frame(now) {
      const t = Math.min(1, (now - t0) / dur), at = ease(t) * total;
      let acc = 0, tip = null;
      paths.forEach((p, i) => {
        const local = Math.max(0, Math.min(1, (at - acc) / lens[i]));
        p.style.strokeDashoffset = String(1 - local);
        if (local > 0 && local < 1) tip = p.getPointAtLength(local * lens[i]);
        acc += lens[i];
      });
      if (tip) needle.setAttribute("transform", `translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)})`);
      needle.style.opacity = t < .97 && tip ? "1" : "0";
      if (t < 1) requestAnimationFrame(frame);
      else { paths.forEach(p => { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; }); setTimeout(() => needle.remove(), 400); }
    })(t0);
  }
  function sewOnView(root = document) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const list = root.querySelectorAll("svg[data-sew]:not([data-sewn])");
    if (reduce || !("IntersectionObserver" in window)) return;
    // hide until sewn; stays visible if scripts stop
    list.forEach(svg => svg.querySelectorAll(".t-line").forEach(p => { p.setAttribute("pathLength", "1"); p.style.strokeDasharray = "1 1"; p.style.strokeDashoffset = "1"; }));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { io.unobserve(e.target); setTimeout(() => sew(e.target), 120); }
    }), { threshold: .45 });
    list.forEach(svg => io.observe(svg));
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
    root.setProperty("--tex-lace", lace(cotton));
    root.setProperty("--tex-lashes", lashesTile({ bg: cotton, fg: "#F8F5EF" }));
  }

  window.Thread = { draw, drawAll, wobble, installTextures, sew, sewOnView };
})();

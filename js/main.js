/* Staša Čimbur — salon. Behaviour: languages, rendering from content.js,
   the walk, plates, halftone reveals, form. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  /* ---------------- language ---------------- */
  function pickLang() {
    try { const s = localStorage.getItem("sc-lang"); if (SITE.languages.includes(s)) return s; } catch (e) {}
    const n = (navigator.language || "").slice(0, 2).toLowerCase();
    return SITE.languages.includes(n) ? n : SITE.defaultLanguage;
  }
  let lang = pickLang();
  const t = k => (UI[lang] && UI[lang][k]) ?? UI.en[k] ?? k;
  const tr = v => v == null ? "" : typeof v === "string" ? v : (v[lang] || v.en || Object.values(v)[0]);
  const byId = Object.fromEntries(WORKS.map(w => [w.id, w]));
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  function field(w, f) {
    const no = "Pl. " + String(WORKS.indexOf(w) + 1).padStart(3, "0");
    switch (f) {
      case "title": return tr(w.title);
      case "no": return no;
      case "year": return w.year ?? t("p.undated");
      case "meta": return no + " · " + (w.year ?? t("p.undated"));
      case "phNo": return no + " · " + t("p.photoSoon");
      case "materials": return cap(w.materials.map(m => tr(MATERIALS[m])).join(", "));
      case "technique": return cap(tr(TECHNIQUES[w.technique]));
      case "story": return tr(STORIES[w.story || (w.wing === "wearable" ? w.room : w.wing === "print" ? "print" : "wall")]);
      case "status":
        if (!w.available) return t("p.sold");
        return t("p.available") + " · " + (w.price ? "€ " + w.price.toLocaleString(lang) : t("p.onRequest"));
      case "alt": return tr(w.title) + " — " + tr(TECHNIQUES[w.technique]);
      case "aria": return t("p.view") + ": " + tr(w.title);
      default: return "";
    }
  }

  function applyLang() {
    html.lang = lang;
    $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$("[data-wt]").forEach(el => {
      const [id, f] = el.dataset.wt.split("|"); const w = byId[id]; if (!w) return;
      const v = field(w, f);
      if (f === "alt") el.setAttribute("alt", v);
      else if (f === "aria") el.setAttribute("aria-label", v);
      else el.textContent = v;
    });
    $$(".langs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    const mail = $("#mail-link"); mail.textContent = SITE.contactEmail; mail.href = "mailto:" + SITE.contactEmail;
    $("#insta-link").href = SITE.instagram;
    if (plateState.id) fillPlate(plateState.id);
  }
  function setLang(l) {
    lang = l; try { localStorage.setItem("sc-lang", l); } catch (e) {}
    applyLang();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  /* ---------------- render from content ---------------- */
  function media(w, opts = {}) {
    if (w.image) {
      const ht = opts.halftone ? ` data-halftone="${opts.halftone}"` : "";
      return `<div class="img"><img src="${w.image}" loading="lazy" decoding="async" data-wt="${w.id}|alt"${ht}></div>`;
    }
    return `<div class="ph"><svg class="thread" data-draw="${w.draw}" data-seed="${w.id}"></svg><span class="mono" data-wt="${w.id}|phNo"></span></div>`;
  }

  function renderLangs() {
    $$(".langs").forEach(box => {
      box.innerHTML = SITE.languages.map((l, i) =>
        (i ? `<span aria-hidden="true">·</span>` : "") + `<button type="button" data-lang="${l}" lang="${l}">${l.toUpperCase()}</button>`).join("");
    });
    document.addEventListener("click", e => { const b = e.target.closest(".langs button"); if (b) setLang(b.dataset.lang); });
  }

  function renderWalk() {
    const end = $(".walk-end");
    ROOMS.forEach((room, i) => {
      if (i > 0) end.insertAdjacentHTML("beforebegin", `<div class="walk-ribbon" aria-hidden="true"></div>`);
      const works = WORKS.filter(w => w.wing === "wearable" && w.room === room.id);
      const pieces = works.map((w, j) => `
        <figure class="piece ${j % 2 ? "piece--b" : "piece--a"}" data-depth="${j % 2 ? 0.55 : 0.25}">
          <button class="piece-hit" type="button" data-open="${w.id}" data-cursor="view" data-wt="${w.id}|aria">
            <div class="piece-frame">${media(w, { halftone: "black" })}</div>
          </button>
          <figcaption class="label">
            <span class="mono" data-wt="${w.id}|meta"></span>
            <span class="label-title" data-wt="${w.id}|title"></span>
            <span class="label-mat" data-wt="${w.id}|materials"></span>
          </figcaption>
        </figure>`).join("");
      end.insertAdjacentHTML("beforebegin", `
        <div class="room" id="room-${room.id}" data-room="${room.id}">
          <div class="room-wall tex-${room.wall}" aria-hidden="true"></div>
          <div class="room-lace" aria-hidden="true"></div>
          <header class="room-title"><span class="mono"><span data-i18n="room"></span> ${ROMAN[i]}</span><h3 data-i18n="rooms.${room.id}"></h3></header>
          ${pieces}
        </div>`);
    });
    $(".floorplan-rooms").innerHTML = ROOMS.map((r, i) =>
      `<li data-room="${r.id}"><button type="button" data-goto="${r.id}">${ROMAN[i]} · <span data-i18n="rooms.${r.id}"></span></button></li>`).join("");
  }

  function renderSalon() {
    const frameType = w => !w.image ? "frame--float" : w.id === "w-03" ? "frame--wood" : "";
    $("#salon-hang").innerHTML = WORKS.filter(w => w.wing === "wall").map(w => `
      <figure class="salon-item span-${w.span || "small"}">
        <button class="frame-btn" type="button" data-open="${w.id}" data-cursor="view" data-wt="${w.id}|aria" data-tilt>
          <div class="frame ${frameType(w)}"><span class="mat">${media(w, { halftone: "black" })}</span></div>
        </button>
        <figcaption class="salon-cap">
          <span class="mono" data-wt="${w.id}|meta"></span>
          <span class="cap-title" data-wt="${w.id}|title"></span>
          <span class="cap-row"><span class="mono" data-wt="${w.id}|status"></span>
          <button type="button" class="link-btn" data-enquire="${w.id}" data-i18n="p.enquire"></button></span>
        </figcaption>
      </figure>`).join("");
    $("#prints-row").innerHTML = WORKS.filter(w => w.wing === "print").map(w => `
      <figure class="salon-item print-item">
        <button class="frame-btn" type="button" data-open="${w.id}" data-cursor="view" data-wt="${w.id}|aria">
          <div class="frame"><span class="mat">${media(w, { halftone: "blue-hover" })}</span></div>
        </button>
        <figcaption class="salon-cap">
          <span class="mono" data-wt="${w.id}|meta"></span>
          <span class="cap-title" data-wt="${w.id}|title"></span>
          <span class="cap-row"><span class="mono">${w.dimensions}</span>
          <button type="button" class="link-btn" data-enquire="${w.id}" data-i18n="p.enquire"></button></span>
        </figcaption>
      </figure>`).join("");
  }

  function renderExhibitions() {
    $("#ex-rows").innerHTML = EXHIBITIONS.map(x => {
      const title = x.title || x.venue;
      const venue = x.title ? x.venue : "";
      return `<div class="ex-row" role="row"${x.image ? ` data-img="${x.image}"` : ""}>
        <span class="yr" role="cell">${x.year || "—"}</span>
        <span class="ttl" role="cell">${title}<small data-i18n="ex.${x.kind}"></small></span>
        <span class="venue" role="cell">${venue}</span>
        <span class="city" role="cell">${x.city}</span>
      </div>`;
    }).join("");
  }

  /* ---------------- halftone (screen-print → photo) ---------------- */
  const COTTON = "#EEE9DF", INKS = { black: "#111010", blue: "#2338C4" };
  function drawHalftone(img, canvas, ink) {
    const box = img.parentElement.getBoundingClientRect();
    const w = Math.round(box.width), h = Math.round(box.height);
    if (!w || !h || !img.naturalWidth) return false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = w * dpr; canvas.height = h * dpr;
    const cell = w < 260 ? 5 : 6.5;
    const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
    const off = document.createElement("canvas"); off.width = cols; off.height = rows;
    const o = off.getContext("2d", { willReadFrequently: true });
    const nw = img.naturalWidth, nh = img.naturalHeight, s = Math.max(w / nw, h / nh);
    const sw = w / s, sh = h / s;
    o.drawImage(img, (nw - sw) / 2, (nh - sh) / 2, sw, sh, 0, 0, cols, rows);
    let data;
    try { data = o.getImageData(0, 0, cols, rows).data; } catch (e) { return false; } // file:// taints canvas
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = COTTON; c.fillRect(0, 0, w, h);
    c.fillStyle = ink;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      const r = cell * 0.62 * Math.sqrt(Math.max(0, 1 - lum));
      if (r < 0.35) continue;
      c.beginPath(); c.arc(x * cell + (y % 2 ? cell / 2 : 0), y * cell, r, 0, 6.2832); c.fill();
    }
    return true;
  }
  function setupHalftones() {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const cv = en.target.querySelector(".ht"); io.unobserve(en.target);
      setTimeout(() => cv && cv.classList.add("is-done"), 280);
    }), { threshold: 0.35 });
    $$("img[data-halftone]").forEach(img => {
      const mode = img.dataset.halftone, hover = mode.endsWith("-hover");
      if (reduce && !hover) return;
      const ink = INKS[mode.replace("-hover", "")];
      const canvas = document.createElement("canvas"); canvas.className = "ht"; canvas.setAttribute("aria-hidden", "true");
      const go = () => {
        if (!drawHalftone(img, canvas, ink)) { canvas.remove(); return; }
        if (!canvas.isConnected) img.after(canvas);
        if (hover) {
          const btn = img.closest(".frame-btn");
          btn.addEventListener("pointerenter", () => canvas.classList.add("is-done"));
          btn.addEventListener("pointerleave", () => canvas.classList.remove("is-done"));
          btn.addEventListener("focus", () => canvas.classList.add("is-done"));
          btn.addEventListener("blur", () => canvas.classList.remove("is-done"));
        } else io.observe(img.parentElement);
      };
      img.loading = "eager";
      if (img.complete && img.naturalWidth) go(); else img.addEventListener("load", go, { once: true });
      let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (canvas.isConnected) drawHalftone(img, canvas, ink); }, 200); });
    });
  }

  /* ---------------- smooth scroll + scroll scenes ---------------- */
  let lenis = null;
  function scrollTo(target, opts = {}) {
    const el = typeof target === "string" ? $(target) : target;
    if (lenis) lenis.scrollTo(el ?? target, { duration: 1.5, ...opts });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: reduce ? "auto" : "smooth" });
    else el && el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  function setupScroll() {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduce && window.Lenis) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      html.classList.add("lenis");
    }

    if (!reduce) {
      $$(".hero [data-parallax]").forEach(el => gsap.to(el, {
        y: parseFloat(el.dataset.parallax), ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      }));
      gsap.to(".hero-wall", { y: 60, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }

    // the walk: horizontal, pinned, only on wide screens with motion allowed
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      html.classList.add("pin-on");
      const track = $("#walk-track");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const rooms = $$(".room", track);
      const lis = $$(".floorplan-rooms li");
      const prog = $(".floorplan-progress");
      let marks = [];
      const measure = () => {
        const d = dist() || 1;
        marks = rooms.map(r => Math.min(1, Math.max(0, (r.offsetLeft - window.innerWidth * 0.15) / d)));
        lis.forEach((li, i) => li.style.left = (marks[i] * 100) + "%");
      };
      const tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: "#salon", pin: true, scrub: 0.7, start: "top top", end: () => "+=" + dist(),
          invalidateOnRefresh: true, onRefresh: measure,
          onUpdate: self => {
            prog.style.transform = `scaleX(${self.progress})`;
            let cur = -1; marks.forEach((m, i) => { if (self.progress >= m - 0.001) cur = i; });
            lis.forEach((li, i) => li.firstElementChild.setAttribute("aria-current", String(i === cur)));
          }
        }
      });
      measure();
      $$(".piece", track).forEach(el => {
        const d = parseFloat(el.dataset.depth || 0) * 110;
        gsap.fromTo(el, { x: d }, { x: -d, ease: "none", scrollTrigger: { trigger: el, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      });
      $$(".walk-ribbon", track).forEach(el => {
        gsap.fromTo(el, { x: 160 }, { x: -160, ease: "none", scrollTrigger: { trigger: el, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      });
      const onGo = e => {
        const b = e.target.closest("[data-goto]"); if (!b) return;
        const i = ROOMS.findIndex(r => r.id === b.dataset.goto);
        const st = tween.scrollTrigger;
        scrollTo(st.start + marks[i] * (st.end - st.start) + 4, { duration: 1.8 });
      };
      $("#floorplan").addEventListener("click", onGo);
      return () => { html.classList.remove("pin-on"); $("#floorplan").removeEventListener("click", onGo); };
    });

    // header colour (created after the pin so positions include its spacing) follows the section under it
    const tones = [[".hero", "dark"], [".prolog", "light"], [".walk", "dark"], [".interlude", "light"], [".wall", "light"], [".ex", "dark"], [".contact", "light"], [".foot", "dark"]];
    const top = $(".top");
    tones.forEach(([sel, tone]) => ScrollTrigger.create({
      trigger: sel, start: "top 36px", end: "bottom 36px",
      onToggle: self => self.isActive && top.classList.toggle("is-light", tone === "light")
    }));

    // thread drawings that draw in once
    if (!reduce) {
      html.classList.add("js-reveal");
      $$("[data-reveal] path").forEach(p => p.setAttribute("pathLength", "1"));
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-drawn"); io.unobserve(e.target); }
      }), { threshold: 0.4 });
      $$("[data-reveal]").forEach(el => io.observe(el));
    }

    $$("[data-scroll]").forEach(a => a.addEventListener("click", e => {
      e.preventDefault(); scrollTo(a.dataset.scroll);
    }));

    window.addEventListener("load", () => ScrollTrigger.refresh());
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------------- plate (detail view) ---------------- */
  const plate = $("#plate");
  const plateState = { id: null, opener: null };
  const order = WORKS.map(w => w.id);

  function fillPlate(id) {
    const w = byId[id];
    const room = ROOMS.find(r => r.id === w.room);
    const band = room ? `<div class="tex-band tex-${room.wall}" aria-hidden="true"></div>` : "";
    const m = $("#plate-media");
    m.classList.remove("is-zoomed");
    m.innerHTML = band + (w.image
      ? `<span class="mat" role="button" tabindex="0" aria-label="${t("p.zoom")}"><img src="${w.image}" alt="${field(w, "alt")}"></span>`
      : `<div class="ph"><svg class="thread" data-draw="${w.draw}" data-seed="${w.id}"></svg><span class="mono">${field(w, "phNo")}</span></div>`);
    Thread.drawAll(m);
    $("#plate-no").textContent = field(w, "meta") + (w.wing === "wearable" ? " · " + t("rooms." + w.room) : "");
    $("#plate-title").textContent = field(w, "title");
    $("#plate-story").textContent = field(w, "story");
    const rows = [["p.materials", field(w, "materials")], ["p.technique", field(w, "technique")]];
    if (w.dimensions) rows.push(["p.dimensions", w.dimensions]);
    rows.push(["p.year", field(w, "year")]);
    $("#plate-dl").innerHTML = rows.map(([k, v]) => `<dt>${t(k)}</dt><dd>${v}</dd>`).join("");
    $("#plate-status").textContent = field(w, "status");
  }
  function openPlate(id, opener) {
    if (!byId[id]) return;
    plateState.id = id; plateState.opener = opener || document.activeElement;
    fillPlate(id);
    plate.hidden = false;
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
    if (!reduce) gsap.fromTo(plate, { opacity: 0 }, { opacity: 1, duration: .45, ease: "power2.out" });
    $("#plate-close").focus({ preventScroll: true });
  }
  function closePlate() {
    if (!plateState.id) return;
    plate.hidden = true; plateState.id = null;
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    if (plateState.opener && plateState.opener.focus) plateState.opener.focus({ preventScroll: true });
  }
  function stepPlate(dir) {
    const i = order.indexOf(plateState.id);
    const next = order[(i + dir + order.length) % order.length];
    plateState.id = next; fillPlate(next);
    try { history.replaceState(null, "", "#" + next); } catch (e) {}
  }
  function setupPlate() {
    document.addEventListener("click", e => {
      const o = e.target.closest("[data-open]"); if (o) { openPlate(o.dataset.open, o); return; }
      const q = e.target.closest("[data-enquire]"); if (q) enquire(q.dataset.enquire);
    });
    $("#plate-close").addEventListener("click", closePlate);
    $("#plate-prev").addEventListener("click", () => stepPlate(-1));
    $("#plate-next").addEventListener("click", () => stepPlate(1));
    $("#plate-enquire").addEventListener("click", () => { const id = plateState.id; closePlate(); enquire(id); });
    const media = $("#plate-media");
    const toggleZoom = () => media.classList.toggle("is-zoomed");
    media.addEventListener("click", e => { if (e.target.closest(".mat")) toggleZoom(); });
    media.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.closest(".mat")) { e.preventDefault(); toggleZoom(); } });
    media.addEventListener("pointermove", e => {
      const mat = media.querySelector(".mat"); if (!mat || !media.classList.contains("is-zoomed")) return;
      const r = mat.getBoundingClientRect();
      mat.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });
    document.addEventListener("keydown", e => {
      if (!plateState.id) return;
      if (e.key === "Escape") closePlate();
      else if (e.key === "ArrowRight") stepPlate(1);
      else if (e.key === "ArrowLeft") stepPlate(-1);
      else if (e.key === "Tab") { // keep focus inside
        const f = $$("button, [tabindex='0']", plate).filter(x => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    const h = location.hash.slice(1); if (byId[h]) setTimeout(() => openPlate(h), 300);
  }

  function enquire(id) {
    const w = byId[id]; if (!w) return;
    $("#f-type").value = w.wing === "wearable" ? "hat" : w.wing === "print" ? "prints" : "original";
    const msg = $("#f-msg");
    msg.value = `${field(w, "title")} (${field(w, "no")})\n\n`;
    scrollTo("#kontakt");
    setTimeout(() => $("#f-name").focus({ preventScroll: true }), reduce ? 50 : 1400);
  }

  /* ---------------- exhibitions: floating image ---------------- */
  function setupExFloat() {
    if (!fine) return;
    const fl = $(".ex-float"), img = fl.querySelector("img");
    $$(".ex-row[data-img]").forEach(row => {
      row.addEventListener("pointerenter", () => { img.src = row.dataset.img; fl.classList.add("is-on"); });
      row.addEventListener("pointerleave", () => fl.classList.remove("is-on"));
      row.addEventListener("pointermove", e => { fl.style.transform = `translate(${e.clientX + 28}px, ${e.clientY - 120}px)`; });
    });
  }

  /* ---------------- salon: gentle tilt toward the cursor ---------------- */
  function setupTilt() {
    if (!fine || reduce) return;
    $$("[data-tilt]").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - .5) * -4, ry = ((e.clientX - r.left) / r.width - .5) * 4;
        b.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------------- form ---------------- */
  function setupForm() {
    const form = $("#form"), status = $("#form-status");
    form.addEventListener("submit", e => {
      e.preventDefault();
      const ok = $("#f-name").value.trim() && /\S+@\S+\.\S+/.test($("#f-email").value) && $("#f-msg").value.trim();
      status.classList.toggle("is-err", !ok);
      // TODO: connect to a form service (Formspree, Netlify Forms…) here.
      status.textContent = ok ? `${t("f.done")} ${SITE.contactEmail}` : t("f.err");
    });
  }

  /* ---------------- start ---------------- */
  Thread.installTextures();
  renderLangs();
  renderWalk();
  renderSalon();
  renderExhibitions();
  Thread.drawAll();
  applyLang();
  setupPlate();
  setupForm();
  setupExFloat();
  setupTilt();
  if (window.gsap && window.ScrollTrigger) setupScroll();
  setupHalftones();
})();

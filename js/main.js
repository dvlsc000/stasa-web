/* Staša Čimbur — salon. Behaviour: languages, rendering from content.js,
   the walk, plates, halftone reveals, form. */
window.__startSite = () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || window.__motion === "still";
  const calm = window.__motion === "calm";               // admin: "calm" motion, fewer flourishes
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  /* Phones: the page body scrolls instead of the browser window. The browser's address bar and
     toolbar then stay still, so they can never push the screen up and down mid-walk, and the
     screen height never changes while scrolling. */
  const appScroll = !fine && matchMedia("(max-width: 899px)").matches;
  if (appScroll) html.classList.add("app-scroll");
  const scroller = appScroll ? document.body : window;
  const getY = () => appScroll ? document.body.scrollTop : window.scrollY;
  // the 3D hat pauses drawing while the page scrolls, so scrolling always has the phone's full power
  window.__scrolling = 0;
  scroller.addEventListener("scroll", () => { window.__scrolling = performance.now(); }, { passive: true });
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
      case "story": return w.story && typeof w.story === "object" ? tr(w.story)
        : tr(STORIES[w.story || (w.wing === "wearable" ? w.room : w.wing === "print" ? "print" : "wall")]);
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
    $$(".langs button, .menu-langs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $$("#lang-list [data-lang]").forEach(li => li.setAttribute("aria-selected", String(li.dataset.lang === lang)));
    $("#lang-code").textContent = lang.toUpperCase(); $("#lang-flag").innerHTML = flagIcon(lang);
    const mm = $("#menu-mail"); if (mm) { mm.textContent = SITE.contactEmail; mm.href = "mailto:" + SITE.contactEmail; }
    const mi = $("#menu-insta"); if (mi) mi.href = SITE.instagram;
    updateHeroCaption();
    const mail = $("#mail-link"); mail.textContent = SITE.contactEmail; mail.href = "mailto:" + SITE.contactEmail;
    const fm = $("#foot-mail"); if (fm) { fm.textContent = SITE.contactEmail; fm.href = "mailto:" + SITE.contactEmail; }
    $("#insta-link").href = SITE.instagram;
    if (plateState.id) fillPlate(plateState.id);
    updateFilmBtn();
    splitTitles();
  }
  function setLang(l) {
    lang = l; try { localStorage.setItem("sc-lang", l); } catch (e) {}
    applyLang();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  /* ---------------- render from content ---------------- */
  // phones get the 1000px copies, large screens the 1800px originals
  const srcset = (src, sizes) => src && (/\/hd\/[^/]+\.webp$/.test(src) || src.includes("/storage/v1/object/public/"))
    ? ` srcset="${src.replace(/\/([^/]+)$/, "/m/$1")} 1000w, ${src} 1800w" sizes="${sizes}"` : "";
  function media(w, opts = {}) {
    if (w.image) {
      const ht = opts.halftone ? ` data-halftone="${opts.halftone}"` : "";
      return `<div class="img"><img src="${w.image}"${srcset(w.image, "(max-width: 899px) 72vw, 24vw")} loading="lazy" decoding="async" data-wt="${w.id}|alt"${ht}></div>`;
    }
    return `<div class="ph"><svg class="thread" data-draw="${w.draw}" data-seed="${w.id}"></svg><span class="mono" data-wt="${w.id}|phNo"></span></div>`;
  }

  /* ---------------- languages: round flag icons, header dropdown ---------------- */
  const LANG_NAMES = { hr: "Hrvatski", en: "English", nl: "Nederlands", es: "Español", de: "Deutsch", fr: "Français" };
  function flag(code) {
    const stripesH = (a, b, c) => `<rect width="60" height="20" fill="${a}"/><rect y="20" width="60" height="20" fill="${b}"/><rect y="40" width="60" height="20" fill="${c}"/>`;
    const art = {
      hr: stripesH("#FF0000", "#FFFFFF", "#171796") +
          `<g transform="translate(22 17)"><path d="M0 0h16v13c0 6-4 9-8 10-4-1-8-4-8-10z" fill="#fff" stroke="#171796" stroke-width=".8"/>` +
          Array.from({ length: 20 }, (_, i) => { const x = i % 4, y = (i / 4) | 0; return (x + y) % 2 ? "" : `<rect x="${x * 4}" y="${y * 4}" width="4" height="4" fill="#FF0000"/>`; }).join("") + `</g>`,
      en: `<rect width="60" height="60" fill="#012169"/><path d="M0 0L60 60M60 0L0 60" stroke="#fff" stroke-width="12"/><path d="M0 0L60 60M60 0L0 60" stroke="#C8102E" stroke-width="4"/><path d="M30 0V60M0 30H60" stroke="#fff" stroke-width="20"/><path d="M30 0V60M0 30H60" stroke="#C8102E" stroke-width="12"/>`,
      nl: stripesH("#AE1C28", "#FFFFFF", "#21468B"),
      es: `<rect width="60" height="60" fill="#AA151B"/><rect y="15" width="60" height="30" fill="#F1BF00"/>`,
      de: stripesH("#000000", "#DD0000", "#FFCE00"),
      fr: `<rect width="20" height="60" fill="#0055A4"/><rect x="20" width="20" height="60" fill="#FFFFFF"/><rect x="40" width="20" height="60" fill="#EF4135"/>`
    }[code];
    const id = "fc" + Math.random().toString(36).slice(2, 8);     // clip ids must be unique per icon
    return `<svg class="flag-svg" viewBox="0 0 60 60" aria-hidden="true"><defs><clipPath id="${id}"><circle cx="30" cy="30" r="30"/></clipPath></defs>` +
      `<g clip-path="url(#${id})">${art}</g><circle cx="30" cy="30" r="29.2" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1.6"/></svg>`;
  }
  const flagIcon = flag;

  function renderLangs() {
    $$(".langs, .menu-langs").forEach(box => {
      box.innerHTML = SITE.languages.map(l =>
        `<button type="button" data-lang="${l}" lang="${l}" aria-label="${LANG_NAMES[l]}"><span class="flag">${flagIcon(l)}</span><span class="mono">${l.toUpperCase()}</span></button>`).join("");
    });
    $("#lang-list").innerHTML = SITE.languages.map(l =>
      `<li role="option" tabindex="-1" data-lang="${l}" lang="${l}"><span class="flag">${flagIcon(l)}</span><span class="lang-name">${LANG_NAMES[l]}</span><span class="mono">${l.toUpperCase()}</span></li>`).join("");
    document.addEventListener("click", e => {
      const b = e.target.closest(".langs button, .menu-langs button, #lang-list [data-lang]");
      if (b) { setLang(b.dataset.lang); closeLangDD(); }
    });
    setupLangDD();
  }
  function closeLangDD(focus) {
    const btn = $(".lang-btn"), list = $("#lang-list");
    if (list.hidden) return;
    $("#lang-dd").classList.remove("is-open"); btn.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!$("#lang-dd").classList.contains("is-open")) list.hidden = true; }, 260);
    if (focus) btn.focus();
  }
  function setupLangDD() {
    const dd = $("#lang-dd"), btn = $(".lang-btn"), list = $("#lang-list");
    const open = () => {
      list.hidden = false; requestAnimationFrame(() => dd.classList.add("is-open"));
      btn.setAttribute("aria-expanded", "true");
      const cur = list.querySelector(`[data-lang="${lang}"]`); (cur || list.firstElementChild).focus({ preventScroll: true });
    };
    btn.addEventListener("click", () => (dd.classList.contains("is-open") ? closeLangDD() : open()));
    document.addEventListener("click", e => { if (!e.target.closest("#lang-dd")) closeLangDD(); });
    list.addEventListener("keydown", e => {
      const items = $$("[data-lang]", list), i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (items[i]) { setLang(items[i].dataset.lang); closeLangDD(true); } }
      else if (e.key === "Escape" || e.key === "Tab") closeLangDD(e.key === "Escape");
    });
  }

  /* ---------------- phone menu: a curtain that drops ---------------- */
  function setupMenu() {
    const menu = $("#menu"), btn = $(".menu-btn");
    const label = btn.querySelector(".menu-label");
    const isOpen = () => !menu.hidden && menu.classList.contains("is-open");
    const open = () => {
      menu.hidden = false; requestAnimationFrame(() => menu.classList.add("is-open"));
      btn.setAttribute("aria-expanded", "true"); html.classList.add("menu-open");
      label.dataset.i18n = "menu.close"; label.textContent = t("menu.close");
      document.body.style.overflow = "hidden"; if (lenis) lenis.stop();
    };
    const close = (then) => {
      menu.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); html.classList.remove("menu-open");
      label.dataset.i18n = "menu.open"; label.textContent = t("menu.open");
      document.body.style.overflow = ""; if (lenis) lenis.start();
      setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; then && then(); }, reduce ? 0 : 520);
    };
    btn.addEventListener("click", () => (isOpen() ? close() : open()));
    menu.addEventListener("click", e => {
      const a = e.target.closest("[data-menu-go]"); if (!a) return;
      e.preventDefault(); close(() => scrollTo(a.dataset.menuGo));
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen()) { close(); btn.focus(); } });
  }

  /* ---------------- navbar: hides on the way down, returns on the way up ---------------- */
  function setupNavbar() {
    const top = $(".top"); let lastY = getY(), ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = getY(), dy = y - lastY;
        // phones: the bar stays put; sliding it in and out on every small swipe made the gallery feel loose
        if (!appScroll && !html.classList.contains("menu-open") && !$("#lang-dd").classList.contains("is-open")) {
          if (y < 120 || dy < -6) top.classList.remove("is-hidden");
          else if (dy > 8) top.classList.add("is-hidden");
        }
        top.classList.toggle("is-scrolled", y > 40);
        lastY = y; ticking = false;
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    top.addEventListener("focusin", () => top.classList.remove("is-hidden"));
  }

  /* ---------------- opening stage: a rotating exhibition ---------------- */
  const hero = { i: 0, timer: 0, ids: [] };
  function renderHero() {
    hero.ids = (SITE.heroWorks || [SITE.heroWork]).filter(id => byId[id] && byId[id].image);
    $("#hero-stage").innerHTML = hero.ids.map((id, i) => {
      const w = byId[id];
      return `<button class="hero-slide${i === 0 ? " is-on" : ""}" type="button" data-open="${id}" data-wt="${id}|aria">
        <span class="mat"><img src="${w.image}"${srcset(w.image, "(max-width: 899px) 52vw, 24vw")} alt="" decoding="async" data-wt="${id}|alt" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></span></button>`;
    }).join("");
    $("#hero-total").textContent = String(hero.ids.length).padStart(2, "0");
    const go = (n, user) => {
      const slides = $$(".hero-slide");
      const prev = hero.i;
      hero.i = (n + slides.length) % slides.length;
      slides.forEach((el, k) => { el.classList.toggle("was-on", k === prev && k !== hero.i); el.classList.toggle("is-on", k === hero.i); });
      $("#hero-n").textContent = String(hero.i + 1).padStart(2, "0");
      updateHeroCaption();
      const bar = $("#hero-bar"); bar.classList.remove("run"); void bar.offsetWidth; if (!reduce) bar.classList.add("run");
      if (user) restart();
    };
    const restart = () => { clearInterval(hero.timer); if (!reduce) hero.timer = setInterval(() => { if (!hero.paused && !document.hidden) go(hero.i + 1); }, window.__heroInterval || 6000); };
    $("#hero-prev").addEventListener("click", () => go(hero.i - 1, true));
    $("#hero-next").addEventListener("click", () => go(hero.i + 1, true));
    const fig = $(".hero-work");
    fig.addEventListener("pointerenter", () => { hero.paused = true; fig.classList.add("is-paused"); });
    fig.addEventListener("pointerleave", () => { hero.paused = false; fig.classList.remove("is-paused"); });
    const heroEl = $(".hero"); heroEl.classList.add("no-anim");     // the first work is simply there, no intro
    hero.go = go; go(0); restart();
    requestAnimationFrame(() => requestAnimationFrame(() => heroEl.classList.remove("no-anim")));
  }
  function updateHeroCaption() {
    const cap = $("#hero-cap"); if (!cap || !hero.ids.length) return;
    cap.textContent = field(byId[hero.ids[hero.i]], "title");
  }


  function renderWalk() {
    const end = $(".walk-end");
    ROOMS.forEach((room, i) => {
      if (i > 0) end.insertAdjacentHTML("beforebegin", `<div class="walk-ribbon" aria-hidden="true"></div>`);
      const works = WORKS.filter(w => w.wing === "wearable" && w.room === room.id);
      const pieces = works.map((w, j) => `
        <figure class="piece ${j % 2 ? "piece--b" : "piece--a"}" style="--j:${j}" data-depth="${j % 2 ? 0.55 : 0.25}">
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
        <div class="room" id="room-${room.id}" data-room="${room.id}" style="--n:${works.length}">
          <div class="room-wall" style="${room.wallCss || ""}" aria-hidden="true"></div>
          <div class="room-lace" aria-hidden="true"></div>
          <header class="room-title"><span class="mono"><span data-i18n="room"></span> ${ROMAN[i]}</span><h3 data-i18n="rooms.${room.id}"></h3></header>
          ${pieces}
        </div>`);
    });
    $(".floorplan-rooms").innerHTML = ROOMS.map((r, i) =>
      `<li data-room="${r.id}"><button type="button" data-goto="${r.id}">${ROMAN[i]} · <span data-i18n="rooms.${r.id}"></span></button></li>`).join("");
  }

  function renderSalon() {
    const frameType = w => !w.image || w.frame === "float" ? "frame--float" : w.frame === "wood" ? "frame--wood" : "";
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
      if ((reduce || !fine) && !hover) return;
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
    else if (typeof target === "number") scroller.scrollTo({ top: target, behavior: reduce ? "auto" : "smooth" });
    else if (el) {
      // native smooth scroll; photos that finish loading on the way can push the target down,
      // so when the scroll ends we check where it is and finish the last stretch
      const sc = appScroll ? document.body : window;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      let tries = 0;
      const fix = () => {
        const off = el.getBoundingClientRect().top;
        if (Math.abs(off) > 3 && tries++ < 4) { sc.scrollBy({ top: off, behavior: "smooth" }); }
        else sc.removeEventListener("scrollend", fix);
      };
      if ("onscrollend" in window) sc.addEventListener("scrollend", fix);
    }
  }

  function setupScroll() {
    gsap.registerPlugin(ScrollTrigger);
    if (appScroll) ScrollTrigger.defaults({ scroller: document.body });
    if (!reduce && window.Lenis && fine) {          // touch devices keep 100% native scrolling
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      html.classList.add("lenis");
    }

    if (!reduce && fine) {
      $$(".hero [data-parallax]").forEach(el => gsap.to(el, {
        y: parseFloat(el.dataset.parallax), ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      }));
      gsap.to(".hero-wall", { y: 60, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }

    // the walk: horizontal, pinned, only on wide screens with motion allowed
    const mm = gsap.matchMedia();
    ScrollTrigger.config({ ignoreMobileResize: true });          // no jumps when the phone's address bar hides
    mm.add({ desk: "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
             mob: "(max-width: 899px) and (prefers-reduced-motion: no-preference)" }, ctx => {
      const { desk, mob } = ctx.conditions;
      if (!desk && !mob) return;
      html.classList.add("pin-on");
      html.classList.toggle("pin-mob", !!mob);
      const track = $("#walk-track");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const rooms = $$(".room", track);
      const lis = $$(".floorplan-rooms li");
      const prog = $(".floorplan-progress");
      let marks = [], cur = -2;
      const measure = () => {
        const d = dist() || 1;
        marks = rooms.map(r => Math.min(1, Math.max(0, (r.offsetLeft - window.innerWidth * 0.15) / d)));
        lis.forEach((li, i) => li.style.left = (marks[i] * 100) + "%");
      };
      const setCurrent = p => {
        let c = -1; marks.forEach((m, i) => { if (p >= m - 0.001) c = i; });
        if (c === cur) return; cur = c;
        lis.forEach((li, i) => li.firstElementChild.setAttribute("aria-current", String(i === c)));
      };

      if (mob) {
        /* Phones: the section is tall and its viewport is position:sticky, so the browser itself
           keeps it in place (no JS pinning). The sideways movement is a CSS scroll-driven animation
           that runs on the compositor, exactly in step with the finger, even while JS is busy.
           Browsers without scroll timelines get the same layout with a light GSAP fallback. */
        html.classList.add("pin-sticky");
        const native = window.CSS && CSS.supports("animation-timeline: view()");
        const kf = document.createElement("style"); document.head.appendChild(kf);
        let lastW = 0;
        const layout = () => {
          const d = dist();
          $("#salon").style.setProperty("--walk-run", Math.round(d * 1.25) + "px");
          kf.textContent = `@keyframes walk-x{from{transform:translate3d(0,0,0)}to{transform:translate3d(${-d}px,0,0)}}`;
          measure();
        };
        layout(); lastW = window.innerWidth;
        if (native) html.classList.add("walk-native");
        const st = ScrollTrigger.create({
          trigger: "#salon", start: "top top", end: "bottom bottom",
          onRefreshInit: () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; layout(); } },
          onUpdate: self => {
            if (!native) { track.style.transform = `translate3d(${-self.progress * dist()}px,0,0)`; prog.style.transform = `scaleX(${self.progress})`; }
            setCurrent(self.progress);
          }
        });
        const onGoM = e => {
          const b = e.target.closest("[data-goto]"); if (!b) return;
          const i = ROOMS.findIndex(r => r.id === b.dataset.goto);
          scroller.scrollTo({ top: st.start + marks[i] * (st.end - st.start) + 4, behavior: "smooth" });
        };
        $("#floorplan").addEventListener("click", onGoM);

        return () => {
          html.classList.remove("pin-on", "pin-mob", "pin-sticky", "walk-native");
          track.style.transform = ""; kf.remove(); $("#salon").style.removeProperty("--walk-run");
          $("#floorplan").removeEventListener("click", onGoM);
        };
      }

      const tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: "#salon", pin: true, start: "top top",
          scrub: 0.7,
          end: () => "+=" + dist(),
          fastScrollEnd: true,
          anticipatePin: 1,
          invalidateOnRefresh: true, onRefresh: measure,
          onUpdate: self => { prog.style.transform = `scaleX(${self.progress})`; setCurrent(self.progress); }
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
      return () => { html.classList.remove("pin-on", "pin-mob"); $("#floorplan").removeEventListener("click", onGo); };
    });

    // header colour (created after the pin so positions include its spacing) follows the section under it
    const tones = [[".hero", "dark"], [".prolog", "light"], [".walk", "dark"], [".film", "light"], [".interlude", "light"], [".wall", "light"], [".ex", "dark"], [".contact", "light"]];
    const top = $(".top");
    tones.forEach(([sel, tone]) => ScrollTrigger.create({
      trigger: sel, start: "top 36px", end: "bottom 36px",
      onToggle: self => self.isActive && top.classList.toggle("is-light", tone === "light")
    }));
    $$(".top-nav [data-sec]").forEach(a => ScrollTrigger.create({
      trigger: a.dataset.sec, start: "top 50%", end: "bottom 50%",
      onToggle: self => a.classList.toggle("is-active", self.isActive)
    }));
    ScrollTrigger.create({ trigger: ".foot", start: "top 45%", end: "bottom bottom",
      onToggle: self => top.classList.toggle("is-light", !self.isActive) });

    // line drawings are sewn in by a little needle when they come into view
    Thread.sewOnView();

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
    const band = room ? `<div class="tex-band" style="${room.wallCss || ""}" aria-hidden="true"></div>` : "";
    const m = $("#plate-media");
    m.classList.remove("is-zoomed");
    m.innerHTML = band + (w.image
      ? `<span class="mat" role="button" tabindex="0" aria-label="${t("p.zoom")}"><img src="${w.image}" alt="${field(w, "alt")}"></span>`
      : `<div class="ph"><svg class="thread" data-draw="${w.draw}" data-seed="${w.id}"></svg><span class="mono">${field(w, "phNo")}</span></div>`);
    const imgs = w.image ? [w.image, ...(w.gallery || [])] : [];
    if (imgs.length > 1) {
      m.insertAdjacentHTML("beforeend", `<div class="plate-thumbs">${imgs.map((src, i) =>
        `<button type="button" class="plate-thumb" data-src="${src}" aria-label="${i + 1} / ${imgs.length}" aria-pressed="${i === 0}"><img src="${src}" alt=""></button>`).join("")}</div>`);
    }
    Thread.drawAll(m);
    if (!reduce) m.querySelectorAll("svg[data-sew]").forEach(svg => Thread.sew(svg));
    $("#plate-no").textContent = field(w, "meta") + (w.wing === "wearable" ? " · " + t("rooms." + w.room) : "");
    $("#plate-title").textContent = field(w, "title");
    $("#plate-story").textContent = field(w, "story");
    const rows = [["p.materials", field(w, "materials")], ["p.technique", field(w, "technique")]];
    if (w.dimensions) rows.push(["p.dimensions", w.dimensions]);
    rows.push(["p.year", field(w, "year")]);
    $("#plate-dl").innerHTML = rows.map(([k, v]) => `<dt>${t(k)}</dt><dd>${v}</dd>`).join("");
    $("#plate-status").textContent = field(w, "status");
  }
  /* the clicked image flies from the wall into the plate, and back on close */
  function flyer(fromRect, src) {
    const im = document.createElement("img");
    im.src = src; im.alt = ""; im.className = "flyer";
    Object.assign(im.style, { left: fromRect.left + "px", top: fromRect.top + "px", width: fromRect.width + "px", height: fromRect.height + "px" });
    document.body.appendChild(im); return im;
  }
  const visibleRect = el => {
    if (!el) return null; const r = el.getBoundingClientRect();
    return r.width > 4 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? r : null;
  };
  function openPlate(id, opener) {
    if (!byId[id]) return;
    plateState.id = id; plateState.opener = opener || document.activeElement;
    const srcImg = opener && opener.querySelector ? opener.querySelector("img") : null;
    const from = !reduce && srcImg ? visibleRect(srcImg) : null;
    fillPlate(id);
    plate.hidden = false;
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
    if (!reduce) {
      const info = $$(".plate-info > *", plate);
      gsap.fromTo(plate, { opacity: 0 }, { opacity: 1, duration: .5, ease: "power2.out" });
      gsap.fromTo(info, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: "expo.out", stagger: .05, delay: .25, clearProps: "transform,opacity" });
      const target = $("#plate-media .mat img");
      if (from && target) {
        const run = () => {
          const to = target.getBoundingClientRect();
          if (!to.width) return;
          const f = flyer(from, target.src);
          target.style.visibility = "hidden";
          gsap.to(f, { left: to.left, top: to.top, width: to.width, height: to.height, duration: .95, ease: "expo.inOut",
            onComplete: () => { target.style.visibility = ""; f.remove(); } });
        };
        target.complete ? run() : target.addEventListener("load", run, { once: true });
      }
    }
    $("#plate-close").focus({ preventScroll: true });
  }
  function closePlate() {
    if (!plateState.id) return;
    const opener = plateState.opener;
    const finish = () => {
      plate.hidden = true; plate.style.opacity = "";
      document.body.style.overflow = "";
      if (lenis) lenis.start();
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    };
    const openedId = plateState.id; plateState.id = null;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    if (reduce) return finish();
    const srcImg = opener && opener.dataset && opener.dataset.open === openedId ? opener.querySelector("img") : null;
    const back = srcImg ? visibleRect(srcImg) : null;
    const cur = $("#plate-media .mat img");
    const from = cur ? cur.getBoundingClientRect() : null;
    if (back && from && from.width) {
      const f = flyer(from, cur.src); cur.style.visibility = "hidden";
      gsap.to(f, { left: back.left, top: back.top, width: back.width, height: back.height, duration: .85, ease: "expo.inOut", onComplete: () => f.remove() });
    }
    gsap.to(plate, { opacity: 0, duration: .45, ease: "power2.inOut", delay: back ? .15 : 0, onComplete: finish });
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
    media.addEventListener("click", e => {
      const th = e.target.closest(".plate-thumb");
      if (th) {
        media.classList.remove("is-zoomed");
        media.querySelector(".mat img").src = th.dataset.src;
        $$(".plate-thumb", media).forEach(b => b.setAttribute("aria-pressed", String(b === th)));
        return;
      }
      if (e.target.closest(".mat")) toggleZoom();
    });
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


  /* ---------------- titles rise out of a fold, word by word ---------------- */
  const splitIO = ("IntersectionObserver" in window) ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); splitIO.unobserve(e.target); }
  }), { threshold: .3 }) : null;
  function splitTitles() {
    if (reduce || !splitIO) return;
    $$("[data-split]").forEach(el => {
      const text = el.textContent; if (!text.trim()) return;
      el.setAttribute("aria-label", text);
      el.innerHTML = text.split(/(\s+)/).map((w, i) => /\s+/.test(w) ? w :
        `<span class="w" aria-hidden="true"><span class="wi" style="--i:${i}">${w}</span></span>`).join("");
      el.classList.add("split");
      if (!el.classList.contains("is-in")) splitIO.observe(el);
    });
  }

  /* ---------------- red thread: page progress on the right edge ---------------- */
  function setupProgressThread() {
    if (reduce || !fine || innerWidth < 900) return;
    const marks = [["#main", "StashaHats"], ["#prolog", "prolog.kicker"], ["#salon", "nav.salon"], ["#film", "film.kicker"], ["#zid", "nav.wall"], ["#izlozbe", "nav.ex"], ["#kontakt", "nav.contact"]];
    const box = document.createElement("nav");
    box.className = "pthread"; box.setAttribute("aria-label", "Sections");
    box.innerHTML = `<span class="pthread-track"></span><span class="pthread-line"></span><span class="pthread-needle"></span>` +
      marks.map(([sel, k]) => `<button type="button" class="pthread-tick" data-scroll-to="${sel}"><span class="mono" ${k.includes(".") ? `data-i18n="${k}"` : ""}>${k.includes(".") ? t(k) : k}</span></button>`).join("");
    document.body.appendChild(box);
    const line = box.querySelector(".pthread-line"), needle = box.querySelector(".pthread-needle");
    const ticks = $$(".pthread-tick", box);
    const place = () => {
      const H = document.documentElement.scrollHeight - innerHeight;
      ticks.forEach((b, i) => {
        const el = $(marks[i][0]); const y = el ? el.getBoundingClientRect().top + scrollY : 0;
        b.style.top = (Math.min(1, y / H) * 100) + "%"; b.dataset.y = y;
      });
    };
    const update = () => {
      const H = document.documentElement.scrollHeight - innerHeight, p = H > 0 ? scrollY / H : 0;
      line.style.transform = `scaleY(${p})`; needle.style.top = (p * 100) + "%";
      ticks.forEach(b => b.classList.toggle("is-past", +b.dataset.y <= scrollY + innerHeight * .4));
      box.classList.toggle("is-on-dark", !!document.querySelector(".top:not(.is-light)"));
    };
    box.addEventListener("click", e => { const b = e.target.closest("[data-scroll-to]"); if (b) scrollTo(b.dataset.scrollTo); });
    place(); update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", () => { place(); update(); });
    ScrollTrigger.addEventListener("refresh", () => { place(); update(); });
  }

  /* ---------------- hero: depth that follows the mouse ---------------- */
  function setupHeroDepth() {
    if (reduce || !fine) return;
    const hero = $(".hero"); let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 2 - 1; ty = (e.clientY - r.top) / r.height * 2 - 1;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    function loop() {
      x += (tx - x) * .08; y += (ty - y) * .08;
      hero.style.setProperty("--mx", x.toFixed(4)); hero.style.setProperty("--my", y.toFixed(4));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > .001 ? requestAnimationFrame(loop) : 0;
    }
  }

  /* ---------------- salon: warm gallery light follows the cursor ---------------- */
  function setupGalleryLight() {
    if (reduce || !fine) return;
    const wall = $(".wall");
    wall.addEventListener("pointermove", e => {
      const r = wall.getBoundingClientRect();
      wall.style.setProperty("--lx", (e.clientX - r.left) + "px"); wall.style.setProperty("--ly", (e.clientY - r.top) + "px");
      wall.classList.add("is-lit");
    });
    wall.addEventListener("pointerleave", () => wall.classList.remove("is-lit"));
  }

  /* ---------------- film: plays muted while in view ---------------- */
  const film = { v: null, userPaused: false };
  function updateFilmBtn() {
    const b = $("#film-toggle"); if (!b || !film.v) return;
    const playing = !film.v.paused;
    b.textContent = t(playing ? "film.pause" : "film.play");
    b.setAttribute("aria-pressed", String(!playing));
  }
  function setupFilm() {
    film.v = $("#film-video"); if (!film.v) return;
    const v = film.v;
    v.addEventListener("play", updateFilmBtn); v.addEventListener("pause", updateFilmBtn);
    $("#film-toggle").addEventListener("click", () => {
      if (v.paused) { film.userPaused = false; v.play().catch(() => {}); }
      else { film.userPaused = true; v.pause(); }
    });
    if (reduce) { v.preload = "metadata"; updateFilmBtn(); return; }
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !film.userPaused) { v.preload = "auto"; v.play().catch(() => {}); }
      else if (!en.isIntersecting) v.pause();
    }, { threshold: 0.35 }).observe(v);
    updateFilmBtn();
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
      if (!ok) { status.textContent = t("f.err"); return; }
      // Without a form service, the message is handed to the visitor's own e-mail app.
      // To receive it directly instead, connect Formspree / Netlify Forms here.
      const type = $("#f-type").selectedOptions[0].textContent;
      const subject = `${type} · ${$("#f-name").value.trim()}`;
      const body = `${$("#f-msg").value.trim()}\n\n${$("#f-name").value.trim()}\n${$("#f-email").value.trim()}`;
      status.textContent = `${t("f.mailing")} ${SITE.contactEmail}`;
      window.location.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  /* ---------------- start ---------------- */
  Thread.installTextures();
  renderLangs();
  renderHero();
  renderWalk();
  renderSalon();
  renderExhibitions();
  Thread.drawAll();
  applyLang();
  setupPlate();
  setupForm();
  setupFilm();
  setupExFloat();
  if (!calm) setupTilt();
  if (window.gsap && window.ScrollTrigger) { setupScroll(); setupProgressThread(); }
  if (!calm) setupHeroDepth();
  setupMenu();
  setupNavbar();
  if (!calm) setupGalleryLight();
  $$("[data-top]").forEach(b => b.addEventListener("click", () => scrollTo(0)));
  if (!calm) setupHalftones();
};
(window.__siteData || Promise.resolve()).then(() => {
  // design of the live season (or the admin's draft in preview), then draw the site
  try {
    if (window.Theme) {
      const t = Theme.pick(window.__siteRaw);
      window.__season = t.season;
      Theme.apply(t.layout, { backgrounds: t.backgrounds });
      document.documentElement.dataset.season = t.season;
      if (t.texts && window.UI) for (const [k, langs] of Object.entries(t.texts)) for (const [l, v] of Object.entries(langs || {})) if (v && UI[l]) UI[l][k] = v;
    }
  } catch (e) { console.warn("theme", e); }
  window.__startSite();
});

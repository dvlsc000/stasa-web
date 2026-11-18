/* =====================================================================
   THEMES — the four seasons of the salon
   Everything the admin "Design" studio controls lives here:
   - BACKGROUNDS: the library of walls (her prints, satin, velvet, colours)
   - DEFAULT_LAYOUTS: the starting design of each season
   - Theme.apply(layout): puts a layout on the page before it is drawn
   A layout saved in Supabase is merged over the season's default, so any
   setting the admin never touched keeps its default.
   ===================================================================== */
(() => {
  const SEASONS = ["spring", "summer", "autumn", "winter"];
  const SEASON_NAME = { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" };

  /* ---------- the wall library. {img} is a tile from images/textures, sized at 600px ---------- */
  const T = f => ({ img: f, size: "600px 600px" });
  const BACKGROUNDS = {
    "eyes-ink":      { name: "Lashed eyes · black on cotton", ...T("eyes-ink-band.webp") },
    "eyes-red-band": { name: "Lashed eyes · red bands", ...T("eyes-red-band.webp") },
    "eyes-red":      { name: "Lashed eyes · red", ...T("eyes-red.webp") },
    "eyes-print":    { name: "Lashed eyes · black, loose", ...T("eyes-print.webp") },
    "eyes-ribbons":  { name: "Lashed eyes with satin ribbons", css: "repeating-linear-gradient(90deg, transparent 0 470px, #8f0c12 470px 473px, var(--red) 473px 486px, #e1383d 486px 491px, var(--red) 491px 504px, #8f0c12 504px 507px, transparent 507px 522px, #8f0c12 522px 524px, var(--red) 524px 536px, #8f0c12 536px 538px, transparent 538px 600px), url({base}images/textures/eyes-print.webp) var(--cotton)", size: "auto, 600px 600px" },
    "lips-red":      { name: "Red lips · striped", ...T("lips-red.webp") },
    "lips-red-plain":{ name: "Red lips", ...T("lips-red-plain.webp") },
    "lips-ink":      { name: "Black lips · satin stripes", ...T("lips-print.webp") },
    "hands":         { name: "Hands wallpaper", ...T("hands-print.webp") },
    "curtain":       { name: "Red velvet curtain", css: "linear-gradient(180deg, rgba(0,0,0,.28), transparent 22%, transparent 72%, rgba(0,0,0,.34)), repeating-linear-gradient(90deg, #6f060b 0px, #a8101a 22px, #d4232a 42px, #e33a3c 50px, #c0141c 66px, #8a0a10 92px, #b1121a 112px, #d52a30 124px, #9c0d14 140px, #6f060b 156px)", dark: true },
    "satin-stripes": { name: "Satin ribbon stripes", css: "repeating-linear-gradient(90deg, #a80f17 0 6px, var(--red) 6px 22px, #e1383d 22px 28px, var(--red) 28px 42px, var(--cotton) 42px 56px, var(--ink) 56px 62px, var(--cotton) 62px 76px)" },
    "stripes-red":   { name: "Red & cotton stripes", css: "repeating-linear-gradient(90deg, var(--red) 0 34px, var(--cotton) 34px 68px)" },
    "stripes-ink":   { name: "Black pinstripe", css: "repeating-linear-gradient(90deg, var(--ink) 0 2px, var(--cotton) 2px 26px)" },
    "dots-red":      { name: "Red polka dots", css: "radial-gradient(circle, var(--red) 0 11px, transparent 11.5px) 0 0 / 64px 64px, radial-gradient(circle, var(--red) 0 11px, transparent 11.5px) 32px 32px / 64px 64px, var(--cotton)", size: "" },
    "dots-ink":      { name: "Black polka dots", css: "radial-gradient(circle, var(--cotton) 0 6px, transparent 6.5px) 0 0 / 44px 44px, radial-gradient(circle, var(--cotton) 0 6px, transparent 6.5px) 22px 22px / 44px 44px, var(--ink)", size: "", dark: true },
    "halftone-blue": { name: "Screen-print blue", css: "radial-gradient(circle, rgba(0,0,30,.22) 1.1px, transparent 1.6px) 0 0 / 7px 7px, var(--blue)", size: "", dark: true },
    "lashes":        { name: "Lace lashes on cotton", css: "var(--tex-lashes, var(--cotton))", size: "220px 170px" },
    "ink":           { name: "Black", css: "var(--ink)", dark: true },
    "cotton":        { name: "Raw cotton", css: "var(--cotton)" },
    "paper":         { name: "Paper white", css: "var(--paper)" },
    "red":           { name: "Satin red", css: "var(--satin)", dark: true },
    "blue":          { name: "Ultramarine", css: "var(--blue)", dark: true }
  };

  const FONTS = {
    display: {
      bodoni:    { name: "Bodoni (house)", stack: '"SC Bodoni", "Bodoni Moda", "Didot", serif' },
      playfair:  { name: "Playfair Display", stack: '"Playfair Display", "Didot", serif', g: "Playfair+Display:ital,wght@0,400..700;1,400..700" },
      cormorant: { name: "Cormorant Garamond", stack: '"Cormorant Garamond", Garamond, serif', g: "Cormorant+Garamond:ital,wght@0,400..600;1,400..600" },
      italiana:  { name: "Italiana", stack: '"Italiana", "Didot", serif', g: "Italiana" },
      dmserif:   { name: "DM Serif Display", stack: '"DM Serif Display", Georgia, serif', g: "DM+Serif+Display:ital@0;1" },
      gloock:    { name: "Gloock", stack: '"Gloock", Georgia, serif', g: "Gloock" }
    },
    body: {
      newsreader:{ name: "Newsreader (house)", stack: '"SC Newsreader", "Newsreader", Georgia, serif' },
      ebgaramond:{ name: "EB Garamond", stack: '"EB Garamond", Garamond, serif', g: "EB+Garamond:ital,wght@0,400..600;1,400..600" },
      lora:      { name: "Lora", stack: '"Lora", Georgia, serif', g: "Lora:ital,wght@0,400..600;1,400..600" },
      sourceserif:{ name: "Source Serif", stack: '"Source Serif 4", Georgia, serif', g: "Source+Serif+4:ital,opsz,wght@0,8..60,300..600;1,8..60,300..600" }
    }
  };

  /* sections that can be moved/hidden. The opening stage is always first, the footer always last */
  const SECTIONS = {
    prolog:   { name: "Prologue (about her)", sel: "#prolog" },
    salon:    { name: "The salon walk (gallery rooms)", sel: "#salon", nav: "#salon" },
    film:     { name: "Film", sel: "#film", nav: "#film" },
    citat:    { name: "Quote with print", sel: "#citat" },
    zid:      { name: "For the wall (collages & prints)", sel: "#zid", nav: "#zid" },
    izlozbe:  { name: "Exhibitions", sel: "#izlozbe", nav: "#izlozbe" },
    kontakt:  { name: "Contact", sel: "#kontakt", nav: "#kontakt" }
  };

  const sec = (tex, tone = "dark", veil = 0) => ({ on: true, bg: tex, tone, veil });
  const base = {
    palette: { red: "#C8161E", ink: "#111010", cotton: "#EEE9DF", paper: "#F6F2EA", blue: "#2338C4" },
    fonts: { display: "bodoni", body: "newsreader" },
    motion: "full",
    hero: { wall: "eyes-ink", floor: "ink", works: ["w-01", "w-02", "pl-001", "w-04", "w-07", "w-09"], interval: 6 },
    order: ["prolog", "salon", "film", "citat", "zid", "izlozbe", "kontakt"],
    sections: {
      prolog: sec("cotton"), salon: sec("ink", "light"), film: sec("lips-red-plain", "dark", 0.86),
      citat: sec("halftone-blue", "light"), zid: sec("lashes"), izlozbe: sec("ink", "light"), kontakt: sec("cotton")
    },
    citat: { work: "w-03" },
    rooms: [
      { id: "hats", wall: "curtain", on: true }, { id: "headpieces", wall: "eyes-red-band", on: true },
      { id: "bags", wall: "lips-red", on: true }, { id: "parasols", wall: "lips-ink", on: true },
      { id: "textiles", wall: "eyes-ribbons", on: true }, { id: "clothes", wall: "hands", on: true }
    ],
    footer: { band: "eyes-ink" }
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  const room = (id, wall, on = true) => ({ id, wall, on });

  const DEFAULT_LAYOUTS = {
    autumn: clone(base),                                   // the house look, as it was designed
    winter: Object.assign(clone(base), {
      palette: { red: "#A40F19", ink: "#0D0B0C", cotton: "#ECE8E2", paper: "#F5F2EE", blue: "#1B2A8C" },
      hero: { wall: "hands", floor: "ink", works: ["w-06", "pl-004", "w-03", "pl-009", "w-05", "pl-008"], interval: 7 },
      order: ["prolog", "salon", "citat", "zid", "film", "izlozbe", "kontakt"],
      sections: {
        prolog: sec("paper"), salon: sec("ink", "light"), film: sec("eyes-print", "dark", 0.9),
        citat: sec("dots-ink", "light"), zid: sec("eyes-ink", "dark", 0.9), izlozbe: sec("ink", "light"), kontakt: sec("paper")
      },
      citat: { work: "w-06" },
      rooms: [room("hats", "curtain"), room("headpieces", "eyes-ink"), room("clothes", "hands"), room("textiles", "eyes-ribbons"), room("bags", "lips-ink"), room("parasols", "lips-red")],
      footer: { band: "hands" }
    }),
    spring: Object.assign(clone(base), {
      palette: { red: "#D2202B", ink: "#141112", cotton: "#F3EEE5", paper: "#FAF7F1", blue: "#3A4FD8" },
      hero: { wall: "lips-red", floor: "ink", works: ["w-02", "pl-006", "w-09", "pl-005", "w-07", "pl-001"], interval: 6 },
      order: ["prolog", "salon", "zid", "film", "citat", "izlozbe", "kontakt"],
      sections: {
        prolog: sec("cotton"), salon: sec("ink", "light"), film: sec("dots-red", "dark", 0.88),
        citat: sec("halftone-blue", "light"), zid: sec("lips-red-plain", "dark", 0.9), izlozbe: sec("ink", "light"), kontakt: sec("cotton")
      },
      citat: { work: "w-02" },
      rooms: [room("headpieces", "eyes-red-band"), room("hats", "curtain"), room("textiles", "eyes-ribbons"), room("parasols", "lips-red"), room("bags", "lips-ink"), room("clothes", "hands")],
      footer: { band: "lips-red" }
    }),
    summer: Object.assign(clone(base), {
      palette: { red: "#D3242C", ink: "#121010", cotton: "#F4EFE6", paper: "#FBF8F2", blue: "#2442D6" },
      hero: { wall: "eyes-red-band", floor: "ink", works: ["pl-001", "w-04", "pl-006", "w-08", "pl-002", "w-01"], interval: 5 },
      order: ["salon", "prolog", "film", "zid", "citat", "izlozbe", "kontakt"],
      sections: {
        prolog: sec("cotton"), salon: sec("ink", "light"), film: sec("stripes-red", "dark", 0.9),
        citat: sec("satin-stripes", "light", 0.55), zid: sec("lashes"), izlozbe: sec("ink", "light"), kontakt: sec("cotton")
      },
      citat: { work: "w-08" },
      rooms: [room("parasols", "lips-red"), room("bags", "lips-ink"), room("hats", "curtain"), room("textiles", "eyes-ribbons"), room("headpieces", "eyes-red-band"), room("clothes", "hands")],
      footer: { band: "eyes-red-band" }
    })
  };

  /* a saved layout over the season default: keeps every untouched setting */
  function merge(def, over) {
    if (!over || typeof over !== "object") return clone(def);
    const out = clone(def);
    for (const k of Object.keys(over)) {
      const v = over[k];
      if (v && typeof v === "object" && !Array.isArray(v) && def[k] && typeof def[k] === "object" && !Array.isArray(def[k])) out[k] = merge(def[k], v);
      else if (v !== undefined && v !== null) out[k] = clone(v);
    }
    return out;
  }

  function seasonForDate(d = new Date()) {
    const m = d.getMonth();                                 // northern hemisphere: Zagreb & Amsterdam
    return m <= 1 || m === 11 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn";
  }

  /* background → css. Custom photos: {type:"image", url, fit:"cover"|"tile", size} */
  function bgCss(key, base = "", custom = []) {
    if (key && typeof key === "object" && key.url) {
      return key.fit === "tile"
        ? { css: `url("${key.url}") var(--cotton)`, size: `${key.size || 600}px auto` }
        : { css: `url("${key.url}") center / cover no-repeat var(--ink)`, size: "" };
    }
    if (typeof key === "string" && key.startsWith("custom:")) {
      const c = custom.find(x => x.id === key.slice(7));
      if (c) return bgCss({ url: c.url, fit: c.fit, size: c.size }, base);
      key = "cotton";
    }
    const b = BACKGROUNDS[key] || BACKGROUNDS.cotton;
    if (b.img) return { css: `url("${base}images/textures/${b.img}") var(--cotton)`, size: b.size };
    return { css: b.css.replaceAll("{base}", base), size: b.size || "" };
  }
  function bgDecl(key, base, custom, veil = 0, veilTone = "cotton") {
    const { css, size } = bgCss(key, base, custom);
    const v = Math.max(0, Math.min(0.97, +veil || 0));
    const veilCol = veilTone === "ink" ? "var(--ink)" : "var(--cotton)";
    const layer = v ? `linear-gradient(color-mix(in srgb, ${veilCol} ${Math.round(v * 100)}%, transparent), color-mix(in srgb, ${veilCol} ${Math.round(v * 100)}%, transparent)), ` : "";
    const sizes = size ? (v ? `auto, ${size}` : size) : "";
    return `background: ${layer}${css} !important;${sizes ? ` background-size: ${sizes} !important;` : ""}`;
  }

  function loadFont(spec) {
    if (!spec || !spec.g || document.querySelector(`link[data-font="${spec.g}"]`)) return;
    const l = document.createElement("link"); l.rel = "stylesheet"; l.dataset.font = spec.g;
    l.href = `https://fonts.googleapis.com/css2?family=${spec.g}&display=swap`; document.head.appendChild(l);
  }

  /* put a layout on the page. Runs before the site renders (rooms, hero, texts) */
  function apply(L, opts = {}) {
    const base = opts.base || "";
    const custom = opts.backgrounds || [];
    const root = document.documentElement;
    const css = [];

    // colours (satin is derived from the red)
    const p = L.palette || {};
    for (const k of ["red", "ink", "cotton", "paper", "blue"]) if (p[k]) root.style.setProperty("--" + k, p[k]);
    if (p.red) root.style.setProperty("--satin", `linear-gradient(90deg, color-mix(in srgb, ${p.red} 70%, #000) 0%, ${p.red} 22%, color-mix(in srgb, ${p.red} 82%, #fff) 40%, ${p.red} 58%, color-mix(in srgb, ${p.red} 82%, #000) 82%, color-mix(in srgb, ${p.red} 66%, #000) 100%)`);
    if (p.cotton) root.style.setProperty("--cotton-2", `color-mix(in srgb, ${p.cotton} 92%, #8a7a62)`);

    // type
    const fd = FONTS.display[L.fonts && L.fonts.display] || FONTS.display.bodoni;
    const fb = FONTS.body[L.fonts && L.fonts.body] || FONTS.body.newsreader;
    loadFont(fd); loadFont(fb);
    root.style.setProperty("--display", fd.stack); root.style.setProperty("--body", fb.stack);

    // motion: "full" | "calm" (no extra flourishes) | "still" (no animation at all)
    root.classList.toggle("motion-calm", L.motion === "calm");
    root.classList.toggle("motion-still", L.motion === "still");
    window.__motion = L.motion || "full";

    // opening stage
    css.push(`.hero-wall { ${bgDecl(L.hero.wall, base, custom)} }`);
    css.push(`.hero-floor, .hero { ${bgDecl(L.hero.floor || "ink", base, custom)} }`);
    if (Array.isArray(L.hero.works) && L.hero.works.length && window.SITE) SITE.heroWorks = L.hero.works.slice();
    window.__heroInterval = Math.max(3, Math.min(15, +L.hero.interval || 6)) * 1000;
    root.style.setProperty("--hero-interval", window.__heroInterval / 1000 + "s");

    // sections: order, visibility, background, text tone
    const main = document.getElementById("main");
    const hero = main && main.querySelector(".hero");
    const order = (L.order || []).filter(id => SECTIONS[id]);
    Object.keys(SECTIONS).forEach(id => { if (!order.includes(id)) order.push(id); });
    let after = hero;
    order.forEach(id => {
      const el = document.querySelector(SECTIONS[id].sel); if (!el || !main) return;
      main.insertBefore(el, after ? after.nextSibling : main.firstChild); after = el;
      const s = (L.sections && L.sections[id]) || { on: true };
      el.hidden = s.on === false;
      el.classList.toggle("tone-light", s.tone === "light");
      el.classList.toggle("tone-dark", s.tone !== "light");
      if (s.bg) css.push(`${SECTIONS[id].sel} { ${bgDecl(s.bg, base, custom, s.veil, s.tone === "light" ? "ink" : "cotton")} }`);
    });
    css.push(`#film::before { display: none !important; }`);
    // the menu follows the section order and skips hidden sections
    const navOrder = order.filter(id => SECTIONS[id].nav && !(L.sections[id] && L.sections[id].on === false)).map(id => SECTIONS[id].nav);
    for (const box of document.querySelectorAll(".top-nav, .menu-nav")) {
      const links = [...box.querySelectorAll("a")];
      links.forEach(a => { const t = a.getAttribute("href"); a.hidden = !navOrder.includes(t); });
      navOrder.forEach((t, i) => { const a = links.find(x => x.getAttribute("href") === t); if (a) { box.appendChild(a); const sup = a.querySelector("sup"); if (sup) sup.textContent = String(i + 1).padStart(2, "0"); } });
    }

    // quote section: which print
    if (L.citat && L.citat.work && window.WORKS) {
      const w = WORKS.find(x => x.id === L.citat.work && x.image);
      const img = document.querySelector("#citat .interlude-print img");
      if (w && img) { img.src = w.image; img.dataset.wt = w.id + "|alt"; img.removeAttribute("srcset"); }
    }

    // gallery rooms: order, walls, which are open
    if (Array.isArray(L.rooms) && window.ROOMS) {
      const known = new Set(ROOMS.map(r => r.id));
      const list = L.rooms.filter(r => known.has(r.id));
      ROOMS.forEach(r => { if (!list.find(x => x.id === r.id)) list.push({ id: r.id, wall: r.wall, on: true }); });
      window.ROOMS = list.filter(r => r.on !== false).map(r => ({ id: r.id, wall: r.wall }));
      // custom photo walls and walls from the library both work through one class per room
      window.ROOMS.forEach(r => { r.wallCss = bgDecl(r.wall, base, custom); });
    }

    // footer
    css.push(`.foot-eyes { ${bgDecl(L.footer && L.footer.band || "eyes-ink", base, custom)} }`);

    // text tone: a light section gets cotton text, a dark one ink text
    css.push(`.tone-light { color: var(--cotton); } .tone-dark { color: var(--ink); }
      .tone-dark .display, .tone-dark .kicker, .tone-dark .ex-row, .tone-dark .walk-intro .display { color: var(--ink); }
      .tone-light .display, .tone-light .kicker { color: var(--cotton); }`);

    let tag = document.getElementById("theme-css");
    if (!tag) { tag = document.createElement("style"); tag.id = "theme-css"; document.head.appendChild(tag); }
    tag.textContent = css.join("\n");
  }

  /* which layout to show: preview draft (admin) → fixed season → season by date */
  function pick(data) {
    const q = new URLSearchParams(location.search);
    const preview = q.has("preview");
    let draft = null;
    if (preview) { try { draft = JSON.parse(localStorage.getItem("sc-preview") || "null"); } catch (e) {} }
    const mode = (draft && draft.season) || q.get("season") || (data && data.season_mode) || "auto";
    const season = SEASONS.includes(mode) ? mode : seasonForDate();
    const saved = draft && draft.season === season ? draft.layout : data && data.layouts && data.layouts[season];
    return { season, layout: merge(DEFAULT_LAYOUTS[season], saved), texts: (draft && draft.texts) || (data && data.texts) || null, backgrounds: (draft && draft.backgrounds) || (data && data.backgrounds) || [] };
  }

  window.Theme = { SEASONS, SEASON_NAME, BACKGROUNDS, FONTS, SECTIONS, DEFAULT_LAYOUTS, merge, apply, pick, bgCss, bgDecl, seasonForDate };
})();

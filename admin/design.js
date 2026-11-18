/* =====================================================================
   DESIGN STUDIO — four seasons, every look of the site, with a live preview
   Draft → (auto-saved) → Publish. Visitors only ever see published designs.
   ===================================================================== */
(() => {
  const A = window.Admin, T = window.Theme;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = A.esc;
  const clone = o => JSON.parse(JSON.stringify(o));
  const SEASON_DOT = { spring: "#e7a3b0", summer: "#d3242c", autumn: "#8a3b12", winter: "#1b2a8c" };
  const PALETTE = [["red", "Ribbon red", "accents, buttons, thread"], ["ink", "Ink", "floor, dark sections, text"], ["cotton", "Cotton", "light walls and text on dark"], ["paper", "Paper", "picture mats and cards"], ["blue", "Screen-print blue", "the quote section"]];
  const D = { season: null, rows: {}, mode: "auto", texts: {}, backgrounds: [], hist: {}, device: "desktop", open: { palette: true }, picker: null, inited: false, textLang: "hr" };

  /* ---------- state ---------- */
  const draftOf = s => (D.rows[s] && D.rows[s].draft) || {};
  const cur = (s = D.season) => T.merge(T.DEFAULT_LAYOUTS[s], draftOf(s));
  const isLive = s => JSON.stringify(T.merge(T.DEFAULT_LAYOUTS[s], draftOf(s))) === JSON.stringify(T.merge(T.DEFAULT_LAYOUTS[s], (D.rows[s] && D.rows[s].published) || {}));
  const liveSeason = () => D.mode === "auto" ? T.seasonForDate() : D.mode;
  const works = () => A.st.works.filter(w => w.image);
  const wTitle = id => { const w = A.st.works.find(x => x.id === id); return w ? A.title(w) : id; };

  function hist(s) { return D.hist[s] || (D.hist[s] = { stack: [JSON.stringify(cur(s))], i: 0 }); }
  function change(fn, { rerender = true } = {}) {
    const L = cur(); fn(L);
    D.rows[D.season].draft = L;
    const h = hist(D.season); h.stack = h.stack.slice(0, h.i + 1); h.stack.push(JSON.stringify(L)); h.i = h.stack.length - 1;
    if (h.stack.length > 120) { h.stack.shift(); h.i--; }
    if (rerender) renderControls();
    queueSave(); queuePreview(); renderState();
  }
  function step(dir) {
    const h = hist(D.season), j = h.i + dir; if (j < 0 || j >= h.stack.length) return;
    h.i = j; D.rows[D.season].draft = JSON.parse(h.stack[j]);
    renderControls(); queueSave(); queuePreview(); renderState();
  }

  /* ---------- saving ---------- */
  let saveT = 0, saving = null;
  function queueSave() { clearTimeout(saveT); $("#draft-state").textContent = "Saving draft…"; saveT = setTimeout(saveDraft, 900); }
  async function saveDraft() {
    const s = D.season, draft = draftOf(s);
    saving = A.sb.from("layouts").update({ draft }).eq("season", s);
    const { error } = await saving; saving = null;
    if (error) { A.toast("Draft not saved: " + A.err(error), true); $("#draft-state").textContent = "Not saved"; return; }
    renderState();
  }
  function renderState() {
    const el = $("#draft-state"); if (!el || !D.season) return;
    const live = isLive(D.season);
    el.innerHTML = live ? `<b class="ok">●</b> Published` : `<b class="warn">●</b> Draft has changes`;
    el.title = D.rows[D.season] && D.rows[D.season].published_at ? "Last published " + new Date(D.rows[D.season].published_at).toLocaleString() : "";
    $("#publish").disabled = live;
    const h = hist(D.season); $("#undo").disabled = h.i <= 0; $("#redo").disabled = h.i >= h.stack.length - 1;
    $$("#season-tabs button").forEach(b => b.querySelector(".chg").hidden = isLive(b.dataset.s));
  }
  async function publish() {
    clearTimeout(saveT); await saveDraft();
    const s = D.season, draft = draftOf(s);
    const when = liveSeason() === s ? "Visitors will see it now." : `Visitors will see it when ${T.SEASON_NAME[s]} is live.`;
    if (!confirm(`Publish the ${T.SEASON_NAME[s]} design? ${when}`)) return;
    const now = new Date().toISOString();
    const { error } = await A.sb.from("layouts").update({ published: draft, published_at: now }).eq("season", s);
    if (error) return A.toast("Not published: " + A.err(error), true);
    D.rows[s].published = clone(draft); D.rows[s].published_at = now;
    renderState(); A.toast(`${T.SEASON_NAME[s]} published`);
  }

  /* ---------- preview ---------- */
  let prevT = 0;
  function writePreview() {
    try { localStorage.setItem("sc-preview", JSON.stringify({ season: D.season, layout: cur(), texts: D.texts, backgrounds: D.backgrounds })); } catch (e) {}
  }
  function queuePreview(now) { clearTimeout(prevT); prevT = setTimeout(reloadPreview, now ? 0 : 550); }
  function frameScroll(f) {
    try { const w = f.contentWindow, d = w.document; return d.documentElement.classList.contains("app-scroll") ? d.body.scrollTop : w.scrollY; } catch (e) { return 0; }
  }
  function reloadPreview() {
    writePreview();
    const f = $("#preview"); const y = frameScroll(f);
    const url = "../?preview=1&t=" + Date.now();
    f.onload = () => {
      const go = () => { try { const w = f.contentWindow, d = w.document; if (d.documentElement.classList.contains("app-scroll")) d.body.scrollTop = y; else w.scrollTo(0, y); } catch (e) {} };
      setTimeout(go, 700); setTimeout(go, 1600);
    };
    if (f.getAttribute("src") === "about:blank" || !f.contentWindow) f.src = url; else f.contentWindow.location.replace(url);
  }
  function fitFrame() {
    const wrap = $("#frame-wrap"), f = $("#preview"); if (!wrap || !f) return;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (D.device === "phone") {
      const w = 390, h = 844, k = Math.min(1, (H - 20) / h, (W - 20) / w);
      Object.assign(f.style, { width: w + "px", height: h + "px", transform: `scale(${k})`, left: (W - w * k) / 2 + "px", top: "10px" });
      wrap.classList.add("is-phone");
    } else {
      const w = 1440, k = W / w;
      Object.assign(f.style, { width: w + "px", height: H / k + "px", transform: `scale(${k})`, left: "0px", top: "0px" });
      wrap.classList.remove("is-phone");
    }
  }

  /* ---------- background picker ---------- */
  function swatchStyle(key) {                    // the wall at a quarter of its real scale
    const c = T.bgCss(key, "../", D.backgrounds);
    return `background:${c.css};${c.size ? `background-size:${c.size.replace(/(\d+)px/g, (m, n) => n / 4 + "px")};` : ""}`;
  }
  const bgName = key => key && key.startsWith && key.startsWith("custom:") ? ((D.backgrounds.find(b => "custom:" + b.id === key) || {}).name || "Own photo") : ((T.BACKGROUNDS[key] || {}).name || key);
  function bgField(path, value, label) {
    const open = D.picker === path;
    return `<div class="bgfield">
      <button type="button" class="bg-current" data-act="pick" data-path="${path}" aria-expanded="${open}">
        <span class="sw" style="${esc(swatchStyle(value))}"></span><span><small>${label}</small>${esc(bgName(value))}</span><i>▾</i></button>
      ${open ? `<div class="bg-grid">${[...Object.keys(T.BACKGROUNDS), ...D.backgrounds.map(b => "custom:" + b.id)].map(k =>
        `<button type="button" class="sw-btn${k === value ? " on" : ""}" data-act="setbg" data-path="${path}" data-v="${esc(k)}" title="${esc(bgName(k))}"><span class="sw" style="${esc(swatchStyle(k))}"></span><span>${esc(bgName(k))}</span></button>`).join("")}
        <label class="sw-btn upload"><span class="sw">+</span><span>Upload your own</span><input type="file" accept="image/*" hidden data-act="upbg" data-path="${path}"></label></div>` : ""}
    </div>`;
  }
  const getPath = (L, path) => path.split(".").reduce((o, k) => o == null ? o : o[k], L);
  const setPath = (L, path, v) => { const ks = path.split("."); const last = ks.pop(); const o = ks.reduce((o, k) => (o[k] == null ? (o[k] = {}) : o[k]), L); o[last] = v; };

  /* ---------- controls ---------- */
  function group(id, title, body, sub = "") {
    const open = !!D.open[id];
    return `<section class="grp${open ? " open" : ""}"><button type="button" class="grp-h" data-act="toggle" data-g="${id}" aria-expanded="${open}"><span>${title}</span><small>${sub}</small><i>${open ? "−" : "+"}</i></button>${open ? `<div class="grp-b">${body}</div>` : ""}</section>`;
  }
  function renderControls() {
    const L = cur(), box = $("#controls"); if (!box) return;
    const keep = box.scrollTop;
    // colours & type
    const pal = PALETTE.map(([k, n, h]) => `<div class="color"><input type="color" data-act="color" data-k="${k}" value="${esc(L.palette[k])}" aria-label="${n}">
        <div><b>${n}</b><small>${h}</small></div><input class="hex" data-act="hex" data-k="${k}" value="${esc(L.palette[k])}" maxlength="7" spellcheck="false"></div>`).join("");
    const fsel = (kind, cur) => `<select data-act="font" data-k="${kind}">${Object.entries(T.FONTS[kind]).map(([k, f]) => `<option value="${k}" ${k === cur ? "selected" : ""}>${f.name}</option>`).join("")}</select>`;
    const motion = `<div class="seg seg--small">${[["full", "Full"], ["calm", "Calm"], ["still", "Still"]].map(([k, n]) => `<button type="button" data-act="motion" data-v="${k}" aria-pressed="${L.motion === k}">${n}</button>`).join("")}</div>`;
    const g1 = `${pal}<div class="two"><label>Headings ${fsel("display", L.fonts.display)}</label><label>Text ${fsel("body", L.fonts.body)}</label></div>
      <label>Motion ${motion}</label><p class="tip">Calm keeps the walk but drops hover effects and halftone reveals. Still turns every animation off.</p>`;

    // opening stage
    const heroWorks = (L.hero.works || []).map((id, i) => {
      const w = A.st.works.find(x => x.id === id);
      return `<li data-id="${i}"><img src="${esc(w ? A.thumb(w.image) : "")}" alt=""><span>${esc(wTitle(id))}</span><span class="handle" aria-hidden="true">⠿</span><button type="button" class="x" data-act="hero-rm" data-i="${i}" aria-label="Remove">×</button></li>`;
    }).join("");
    const addable = works().filter(w => !(L.hero.works || []).includes(w.id));
    const g2 = `${bgField("hero.wall", L.hero.wall, "Wall behind the work")}${bgField("hero.floor", L.hero.floor, "Floor")}
      <p class="lbl">Works on the stage, in order</p><ol class="mini-works" id="hero-works">${heroWorks}</ol>
      <select data-act="hero-add"><option value="">+ Add a work…</option>${addable.map(w => `<option value="${esc(w.id)}">${esc(A.title(w))}</option>`).join("")}</select>
      <label>Seconds per work <span class="range"><input type="range" min="3" max="15" step="1" data-act="interval" value="${L.hero.interval || 6}"><b>${L.hero.interval || 6}s</b></span></label>`;

    // sections
    const secs = L.order.map(id => {
      const s = L.sections[id] || { on: true }, def = T.SECTIONS[id], open = D.open["sec-" + id];
      const extra = id === "citat" ? `<label>Print shown <select data-act="citat-work">${works().map(w => `<option value="${esc(w.id)}" ${w.id === (L.citat && L.citat.work) ? "selected" : ""}>${esc(A.title(w))}</option>`).join("")}</select></label>` : "";
      return `<li class="sec${s.on === false ? " off" : ""}" data-id="${id}">
        <div class="sec-h"><span class="handle" aria-hidden="true">⠿</span>
          <span class="sw sw--s" style="${esc(swatchStyle(s.bg))}"></span>
          <button type="button" class="sec-name" data-act="sec-open" data-id="${id}">${def.name}</button>
          <button type="button" class="eye" data-act="sec-on" data-id="${id}" aria-pressed="${s.on !== false}" title="${s.on === false ? "Hidden — click to show" : "Visible — click to hide"}">${s.on === false ? "◌" : "◉"}</button></div>
        ${open ? `<div class="sec-b">${bgField("sections." + id + ".bg", s.bg, "Background")}
          <label>Soften the background <span class="range"><input type="range" min="0" max="95" step="5" data-act="veil" data-id="${id}" value="${Math.round((s.veil || 0) * 100)}"><b>${Math.round((s.veil || 0) * 100)}%</b></span></label>
          <label>Text colour <div class="seg seg--small"><button type="button" data-act="tone" data-id="${id}" data-v="dark" aria-pressed="${s.tone !== "light"}">Dark text</button><button type="button" data-act="tone" data-id="${id}" data-v="light" aria-pressed="${s.tone === "light"}">Light text</button></div></label>
          ${extra}</div>` : ""}
      </li>`;
    }).join("");
    const g3 = `<p class="tip">The opening stage is always first and the footer always last. Drag ⠿ to reorder, ◉ to hide.</p><ol class="secs" id="secs">${secs}</ol>`;

    // rooms
    const ROOM_NAME = { hats: "Hats", headpieces: "Headpieces & fascinators", bags: "Bags", parasols: "Parasols", textiles: "Scarves & textiles", clothes: "Clothes" };
    const rooms = L.rooms.map((r, i) => {
      const open = D.open["room-" + r.id];
      return `<li class="sec${r.on === false ? " off" : ""}" data-id="${i}">
        <div class="sec-h"><span class="handle" aria-hidden="true">⠿</span><span class="sw sw--s" style="${esc(swatchStyle(r.wall))}"></span>
          <button type="button" class="sec-name" data-act="room-open" data-id="${r.id}">${ROOM_NAME[r.id] || r.id}</button>
          <button type="button" class="eye" data-act="room-on" data-i="${i}" aria-pressed="${r.on !== false}">${r.on === false ? "◌" : "◉"}</button></div>
        ${open ? `<div class="sec-b">${bgField("rooms." + i + ".wall", r.wall, "Wall")}</div>` : ""}</li>`;
    }).join("");
    const g4 = `<p class="tip">The rooms of the gallery walk. Drag to change the order, ◉ to close a room this season.</p><ol class="secs" id="rooms">${rooms}</ol>`;

    // footer + own backgrounds
    const g5 = bgField("footer.band", L.footer.band, "Band above the footer");
    const own = D.backgrounds.map(b => `<li><span class="sw" style="${esc(swatchStyle("custom:" + b.id))}"></span>
        <div><b>${esc(b.name)}</b><div class="seg seg--small"><button type="button" data-act="bg-fit" data-id="${b.id}" data-v="cover" aria-pressed="${b.fit !== "tile"}">Fill</button><button type="button" data-act="bg-fit" data-id="${b.id}" data-v="tile" aria-pressed="${b.fit === "tile"}">Repeat as pattern</button></div></div>
        <button type="button" class="link danger" data-act="bg-del" data-id="${b.id}">Delete</button></li>`).join("");
    const g6 = `<ul class="own">${own || `<li class="tip">No own backgrounds yet.</li>`}</ul>
      <label class="btn btn--small">+ Upload a background<input type="file" accept="image/*" hidden data-act="upbg"></label>`;

    box.innerHTML =
      group("palette", "Colours, type & motion", g1, `${L.fonts.display === "bodoni" ? "House" : T.FONTS.display[L.fonts.display].name} · ${L.motion}`) +
      group("hero", "Opening stage", g2, `${(L.hero.works || []).length} works`) +
      group("sections", "Page sections", g3, `${L.order.filter(id => (L.sections[id] || {}).on !== false).length} of ${L.order.length} shown`) +
      group("rooms", "Gallery rooms", g4, `${L.rooms.filter(r => r.on !== false).length} open`) +
      group("footer", "Footer", g5) +
      group("own", "My backgrounds", g6, `${D.backgrounds.length}`);
    box.scrollTop = keep;
    if ($("#secs")) A.sortable($("#secs"), "li", ids => change(L => { L.order = ids; }));
    if ($("#rooms")) A.sortable($("#rooms"), "li", ids => change(L => { const r = L.rooms; L.rooms = ids.map(i => r[+i]); }));
    if ($("#hero-works")) A.sortable($("#hero-works"), "li", ids => change(L => { const w = L.hero.works; L.hero.works = ids.map(i => w[+i]); }));
  }

  /* ---------- control events ---------- */
  function onClick(e) {
    const b = e.target.closest("[data-act]"); if (!b || b.tagName === "INPUT" || b.tagName === "SELECT") return;
    const a = b.dataset.act;
    if (a === "toggle") { D.open[b.dataset.g] = !D.open[b.dataset.g]; renderControls(); }
    else if (a === "pick") { D.picker = D.picker === b.dataset.path ? null : b.dataset.path; renderControls(); }
    else if (a === "setbg") { D.picker = null; change(L => setPath(L, b.dataset.path, b.dataset.v)); }
    else if (a === "motion") change(L => { L.motion = b.dataset.v; });
    else if (a === "hero-rm") change(L => { L.hero.works.splice(+b.dataset.i, 1); });
    else if (a === "sec-open") { D.open["sec-" + b.dataset.id] = !D.open["sec-" + b.dataset.id]; renderControls(); }
    else if (a === "room-open") { D.open["room-" + b.dataset.id] = !D.open["room-" + b.dataset.id]; renderControls(); }
    else if (a === "sec-on") change(L => { const s = L.sections[b.dataset.id] || (L.sections[b.dataset.id] = { on: true }); s.on = s.on === false; });
    else if (a === "room-on") change(L => { const r = L.rooms[+b.dataset.i]; r.on = r.on === false; });
    else if (a === "tone") change(L => { L.sections[b.dataset.id].tone = b.dataset.v; });
    else if (a === "bg-fit") saveBackgrounds(D.backgrounds.map(x => x.id === b.dataset.id ? { ...x, fit: b.dataset.v } : x));
    else if (a === "bg-del") {
      const bg = D.backgrounds.find(x => x.id === b.dataset.id);
      if (!confirm(`Delete “${bg.name}”? Places that use it go back to raw cotton.`)) return;
      A.removePhoto(bg.url); saveBackgrounds(D.backgrounds.filter(x => x !== bg));
    }
  }
  function onInput(e) {
    const t = e.target, a = t.dataset.act; if (!a) return;
    if (a === "color") { $(`.hex[data-k="${t.dataset.k}"]`).value = t.value; change(L => { L.palette[t.dataset.k] = t.value; }, { rerender: false }); }
    else if (a === "hex" && /^#[0-9a-f]{6}$/i.test(t.value)) { $(`input[type=color][data-k="${t.dataset.k}"]`).value = t.value; change(L => { L.palette[t.dataset.k] = t.value; }, { rerender: false }); }
    else if (a === "interval") { t.nextElementSibling.textContent = t.value + "s"; change(L => { L.hero.interval = +t.value; }, { rerender: false }); }
    else if (a === "veil") { t.nextElementSibling.textContent = t.value + "%"; change(L => { L.sections[t.dataset.id].veil = +t.value / 100; }, { rerender: false }); }
  }
  async function onChange(e) {
    const t = e.target, a = t.dataset.act; if (!a) return;
    if (a === "font") change(L => { L.fonts[t.dataset.k] = t.value; });
    else if (a === "hero-add" && t.value) change(L => { L.hero.works = [...(L.hero.works || []), t.value]; });
    else if (a === "citat-work") change(L => { L.citat = { work: t.value }; });
    else if (a === "upbg") {
      const f = t.files[0]; if (!f) return;
      try {
        A.toast("Uploading background…");
        const url = await A.uploadPhoto(f, "backgrounds");
        const id = Date.now().toString(36);
        await saveBackgrounds([...D.backgrounds, { id, name: f.name.replace(/\.[^.]+$/, "").slice(0, 40), url, fit: "cover", size: 600 }]);
        if (t.dataset.path) { D.picker = null; change(L => setPath(L, t.dataset.path, "custom:" + id)); }
      } catch (x) { A.toast("Upload failed: " + A.err(x), true); }
    }
  }
  async function saveBackgrounds(list) {
    const { error } = await A.sb.from("settings").update({ backgrounds: list }).eq("id", 1);
    if (error) return A.toast("Not saved: " + A.err(error), true);
    D.backgrounds = list; A.st.settings.backgrounds = list; renderControls(); queuePreview();
  }

  /* ---------- season bar ---------- */
  function renderSeasons() {
    const live = liveSeason();
    $("#season-tabs").innerHTML = T.SEASONS.map(s => `<button role="tab" data-s="${s}" aria-selected="${s === D.season}">
      <i style="background:${SEASON_DOT[s]}"></i>${T.SEASON_NAME[s]}${s === live ? ` <small>live</small>` : ""}<b class="chg" title="Unpublished changes">•</b></button>`).join("");
    $("#copy-from").innerHTML = `<option value="">Copy from…</option>` + T.SEASONS.filter(s => s !== D.season).map(s => `<option value="${s}">${T.SEASON_NAME[s]}</option>`).join("");
    $("#season-mode").value = D.mode;
    $("#open-preview").href = "../?preview=1";
    renderState();
  }
  function selectSeason(s) {
    clearTimeout(saveT); if (D.season && saveT) saveDraft();
    D.season = s; D.picker = null; renderSeasons(); renderControls(); queuePreview(true);
  }

  /* ---------- texts ---------- */
  const DEF_UI = clone(window.UI);
  function textKeys() { return Object.keys(DEF_UI.en || DEF_UI.hr); }
  function renderTexts() {
    const lang = D.textLang, q = ($("#text-search").value || "").toLowerCase(), onlyChanged = $("#text-changed").checked;
    $("#text-lang").innerHTML = SITE.languages.map(l => `<button data-l="${l}" aria-pressed="${l === lang}">${l.toUpperCase()}</button>`).join("");
    const groups = {};
    textKeys().forEach(k => {
      const def = (DEF_UI[lang] && DEF_UI[lang][k]) || "", val = (D.texts[k] && D.texts[k][lang]) || "";
      if (onlyChanged && !val) return;
      if (q && !(k + " " + def + " " + val + " " + ((DEF_UI.en || {})[k] || "")).toLowerCase().includes(q)) return;
      (groups[k.split(".")[0]] = groups[k.split(".")[0]] || []).push([k, def, val]);
    });
    const GN = { nav: "Navigation", hero: "Opening stage", prolog: "Prologue", walk: "Salon walk", room: "Rooms", wing1: "Salon walk", film: "Film", quote: "Quote", wall: "For the wall", ex: "Exhibitions", contact: "Contact", f: "Contact form", foot: "Footer", p: "Piece details", menu: "Menu", hat3d: "3D hat" };
    $("#texts-list").innerHTML = Object.entries(groups).map(([g, rows]) => `<section class="tgroup"><h3>${GN[g] || g}</h3>${rows.map(([k, def, val]) => {
      const long = (def || "").length > 70;
      return `<div class="trow${val ? " changed" : ""}"><code>${esc(k)}</code>${long
        ? `<textarea data-k="${esc(k)}" placeholder="${esc(def)}" rows="${Math.min(6, Math.ceil(def.length / 90) + 1)}">${esc(val)}</textarea>`
        : `<input data-k="${esc(k)}" placeholder="${esc(def)}" value="${esc(val)}">`}${val ? `<button class="link" data-reset="${esc(k)}" title="Back to the original">↺</button>` : "<span></span>"}</div>`;
    }).join("")}</section>`).join("") || `<p class="hint">Nothing matches.</p>`;
  }
  let textT = 0;
  function onText(e) {
    const t = e.target.closest("[data-k]"); if (!t) return;
    const k = t.dataset.k, v = t.value;
    D.texts[k] = D.texts[k] || {};
    if (v.trim()) D.texts[k][D.textLang] = v; else delete D.texts[k][D.textLang];
    if (!Object.keys(D.texts[k]).length) delete D.texts[k];
    t.closest(".trow").classList.toggle("changed", !!v.trim());
    $("#texts-msg").textContent = "Unsaved changes";
    clearTimeout(textT); textT = setTimeout(writePreview, 300);
  }
  async function saveTexts() {
    const { error } = await A.sb.from("settings").update({ texts: D.texts }).eq("id", 1);
    const m = $("#texts-msg"); m.className = error ? "msg err" : "msg ok"; m.textContent = error ? A.err(error) : "Saved — live on the site";
    if (!error) { A.st.settings.texts = clone(D.texts); queuePreview(); }
  }

  /* ---------- start ---------- */
  async function init() {
    if (D.inited) { renderControls(); return; }
    D.inited = true;
    const { data, error } = await A.sb.from("layouts").select("*");
    if (error) { A.toast("Designs not loaded: " + A.err(error), true); return; }
    data.forEach(r => D.rows[r.season] = r);
    T.SEASONS.forEach(s => { if (!D.rows[s]) D.rows[s] = { season: s, draft: {}, published: {} }; });
    const s = A.st.settings || {};
    D.mode = s.season_mode || "auto"; D.texts = clone(s.texts || {}); D.backgrounds = clone(s.backgrounds || []);
    D.season = liveSeason();

    const box = $("#controls");
    box.addEventListener("click", onClick); box.addEventListener("input", onInput); box.addEventListener("change", onChange);
    $("#season-tabs").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (b && b.dataset.s !== D.season) selectSeason(b.dataset.s); });
    $("#season-mode").addEventListener("change", async e => {
      const v = e.target.value;
      const { error } = await A.sb.from("settings").update({ season_mode: v }).eq("id", 1);
      if (error) return A.toast(A.err(error), true);
      D.mode = v; renderSeasons();
      A.toast(v === "auto" ? `Seasons change by date — ${T.SEASON_NAME[T.seasonForDate()]} is live now` : `${T.SEASON_NAME[v]} is live now`);
    });
    $("#publish").addEventListener("click", publish);
    $("#undo").addEventListener("click", () => step(-1)); $("#redo").addEventListener("click", () => step(1));
    document.addEventListener("keydown", e => {
      if (!document.body.classList.contains("in-studio") || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z" || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      e.preventDefault(); step(e.shiftKey ? 1 : -1);
    });
    $("#copy-from").addEventListener("change", e => {
      const from = e.target.value; e.target.value = ""; if (!from) return;
      if (!confirm(`Replace the ${T.SEASON_NAME[D.season]} draft with the ${T.SEASON_NAME[from]} design?`)) return;
      change(L => { Object.keys(L).forEach(k => delete L[k]); Object.assign(L, cur(from)); });
    });
    $("#reset-season").addEventListener("click", () => {
      if (!confirm(`Reset the ${T.SEASON_NAME[D.season]} draft to its original design?`)) return;
      change(L => { Object.keys(L).forEach(k => delete L[k]); Object.assign(L, clone(T.DEFAULT_LAYOUTS[D.season])); });
    });
    $$("#device button").forEach(b => b.addEventListener("click", () => {
      D.device = b.dataset.d; $$("#device button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); fitFrame(); queuePreview(true);
    }));
    window.addEventListener("resize", fitFrame);
    // texts tab
    $("#text-lang").addEventListener("click", e => { const b = e.target.closest("[data-l]"); if (b) { D.textLang = b.dataset.l; renderTexts(); } });
    $("#text-search").addEventListener("input", renderTexts); $("#text-changed").addEventListener("change", renderTexts);
    $("#texts-list").addEventListener("input", onText);
    $("#texts-list").addEventListener("click", e => {
      const r = e.target.closest("[data-reset]"); if (!r) return;
      const k = r.dataset.reset; if (D.texts[k]) { delete D.texts[k][D.textLang]; if (!Object.keys(D.texts[k]).length) delete D.texts[k]; }
      $("#texts-msg").textContent = "Unsaved changes"; renderTexts(); writePreview();
    });
    $("#save-texts").addEventListener("click", saveTexts);

    renderSeasons(); renderControls(); renderTexts();
    if (!$("#tab-design").hidden) { document.body.classList.add("in-studio"); fitFrame(); queuePreview(true); }
  }
  function onTab(tab) {
    if (tab === "design") { requestAnimationFrame(() => { fitFrame(); queuePreview(true); }); }
    if (tab === "texts") renderTexts();
  }

  window.Design = { init, onTab };
})();

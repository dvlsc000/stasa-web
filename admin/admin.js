/* StashaHats atelier: a small admin for the website content stored in Supabase.
   Sign in → edit works (6 languages, photos, order), exhibitions, the opening stage, contact, admins. */
(() => {
  const C = window.SUPABASE;
  const sb = supabase.createClient(C.url, C.key, { auth: { persistSession: true, detectSessionInUrl: true } });
  const LANGS = SITE.languages;                          // hr, en, nl, es, de, fr
  const LANG_NAME = { hr: "Hrvatski", en: "English", nl: "Nederlands", es: "Español", de: "Deutsch", fr: "Français" };
  const ROOM_NAME = { hats: "Hats", headpieces: "Headpieces & fascinators", bags: "Bags", parasols: "Parasols", textiles: "Scarves & textiles", clothes: "Clothes" };
  const WING_NAME = { wearable: "Wearable", wall: "For the wall", print: "Prints" };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const st = { works: [], rooms: [], ex: [], settings: null, wing: "wearable", room: "", me: null, edit: null };

  /* ---------- helpers ---------- */
  let toastT = 0;
  function toast(msg, err = false) {
    const t = $("#toast"); t.textContent = msg; t.classList.toggle("err", err); t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), err ? 5000 : 2600);
  }
  const title = w => { const t = w.title || {}; return typeof t === "string" ? t : (t.hr || t.en || Object.values(t)[0] || "(untitled)"); };
  const src = p => !p ? "" : /^https?:/.test(p) ? p : "../" + p;             // site paths are relative to the site root
  const thumb = p => !p ? "" : /\/storage\/v1\/object\/public\//.test(p) || /\/hd\/[^/]+$/.test(p) ? src(p).replace(/\/([^/]+)$/, "/m/$1") : src(p);
  const publicUrl = path => sb.storage.from(C.bucket).getPublicUrl(path).data.publicUrl;
  const pathFromUrl = url => { const m = String(url).match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/); return m ? decodeURIComponent(m[1]) : null; };
  const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const err = e => (e && (e.message || e.error_description || e.error)) || String(e);

  /* ---------- photos: resize in the browser, upload in two sizes ---------- */
  async function toBlob(canvas, type, q) { return new Promise(r => canvas.toBlob(r, type, q)); }
  async function resize(file, max) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch (e) {                                                   // older browsers
      bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("This photo format can't be read. Please use JPG or PNG.")); i.src = URL.createObjectURL(file); });
    }
    const w = bmp.width, h = bmp.height, s = Math.min(1, max / Math.max(w, h));
    const c = document.createElement("canvas"); c.width = Math.round(w * s); c.height = Math.round(h * s);
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(bmp, 0, 0, c.width, c.height);
    let b = await toBlob(c, "image/webp", 0.88);
    if (!b || b.type !== "image/webp") b = await toBlob(c, "image/jpeg", 0.88);   // Safari can't write WebP
    return b;
  }
  async function uploadPhoto(file, folder, onProgress = () => {}) {
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
    onProgress(10);
    const big = await resize(file, 1800); onProgress(35);
    const small = await resize(file, 1000); onProgress(50);
    const ext = big.type === "image/webp" ? "webp" : "jpg";
    const name = stamp() + "." + ext;
    const up = async (path, blob) => {
      const { error } = await sb.storage.from(C.bucket).upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
      if (error) throw error;
    };
    await up(`${folder}/${name}`, big); onProgress(80);
    await up(`${folder}/m/${name}`, small); onProgress(100);
    return publicUrl(`${folder}/${name}`);
  }
  async function removePhoto(url) {                                  // only photos stored in Supabase
    const p = pathFromUrl(url); if (!p) return;
    const small = p.replace(/\/([^/]+)$/, "/m/$1");
    await sb.storage.from(C.bucket).remove([p, small]);
  }

  /* ---------- sign in ---------- */
  function showGate(msg = "") { $("#app").hidden = true; $("#gate").hidden = false; $("#login-msg").textContent = msg; }
  async function enter(session) {
    st.me = session.user.email;
    const { data, error } = await sb.from("admins").select("email");
    if (error || !data || !data.some(a => a.email.toLowerCase() === st.me.toLowerCase())) {
      await sb.auth.signOut();
      return showGate(`${st.me} is not on the admin list. Ask an admin to add you.`);
    }
    $("#gate").hidden = true; $("#app").hidden = false;
    await loadAll();
  }
  $("#login-form").addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("#login-msg"); msg.className = "msg"; msg.textContent = "Signing in…";
    const { data, error } = await sb.auth.signInWithPassword({ email: $("#login-email").value.trim(), password: $("#login-pass").value });
    if (error) { msg.className = "msg err"; msg.textContent = error.message === "Invalid login credentials" ? "Wrong e-mail or password." : error.message; return; }
    enter(data.session);
  });
  $("#signup-btn").addEventListener("click", async () => {
    const email = $("#login-email").value.trim(), password = $("#login-pass").value, msg = $("#login-msg");
    if (!email || password.length < 8) { msg.className = "msg err"; msg.textContent = "Type your e-mail and a new password (at least 8 characters), then press this again."; return; }
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) { msg.className = "msg err"; msg.textContent = error.message; return; }
    if (data.session) return enter(data.session);
    msg.className = "msg ok"; msg.textContent = "Check your inbox and confirm your e-mail, then sign in here.";
  });
  $("#forgot-btn").addEventListener("click", async () => {
    const email = $("#login-email").value.trim(), msg = $("#login-msg");
    if (!email) { msg.className = "msg err"; msg.textContent = "Type your e-mail first."; return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    msg.className = error ? "msg err" : "msg ok";
    msg.textContent = error ? error.message : "We sent you a link to choose a new password.";
  });
  $("#newpass-form").addEventListener("submit", async e => {
    e.preventDefault();
    const { error } = await sb.auth.updateUser({ password: $("#newpass").value });
    const m = $("#newpass-msg");
    if (error) { m.className = "msg err"; m.textContent = error.message; return; }
    $("#newpass-form").hidden = true; $("#login-form").hidden = false;
    const { data } = await sb.auth.getSession(); if (data.session) enter(data.session);
  });
  $("#logout").addEventListener("click", async () => { await sb.auth.signOut(); showGate(); });
  sb.auth.onAuthStateChange((ev) => {
    if (ev === "PASSWORD_RECOVERY") { $("#gate").hidden = false; $("#app").hidden = true; $("#login-form").hidden = true; $("#newpass-form").hidden = false; }
  });

  /* ---------- load ---------- */
  async function loadAll() {
    const [w, r, x, s] = await Promise.all([
      sb.from("works").select("*").order("sort").order("created_at"),
      sb.from("rooms").select("*").order("sort"),
      sb.from("exhibitions").select("*").order("sort").order("id"),
      sb.from("settings").select("*").eq("id", 1).maybeSingle()
    ]);
    const e = w.error || r.error || x.error || s.error; if (e) return toast("Could not load: " + err(e), true);
    st.works = w.data; st.rooms = r.data; st.ex = x.data; st.settings = s.data || { id: 1, hero_works: [] };
    renderRoomFilter(); renderWorks(); renderEx(); renderSettings(); renderAdmins(); checkImport();
  }

  /* ---------- tabs ---------- */
  $$(".tabs button").forEach(b => b.addEventListener("click", () => {
    $$(".tabs button").forEach(x => x.setAttribute("aria-selected", String(x === b)));
    $$(".panel").forEach(p => p.hidden = p.id !== "tab-" + b.dataset.tab);
  }));

  /* ---------- drag to reorder (mouse and touch, by the ⠿ handle or the whole item) ---------- */
  function sortable(list, itemSel, onDrop) {
    let drag = null, over = null;
    list.addEventListener("pointerdown", e => {
      const h = e.target.closest(".handle"); if (!h) return;
      const it = h.closest(itemSel); if (!it) return;
      e.preventDefault(); drag = it; it.classList.add("dragging"); h.setPointerCapture(e.pointerId);
    });
    list.addEventListener("pointermove", e => {
      if (!drag) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const it = el && el.closest(itemSel);
      if (over) over.classList.remove("drop-before");
      over = it && it !== drag && list.contains(it) ? it : null;
      if (over) over.classList.add("drop-before");
    });
    const end = () => {
      if (!drag) return;
      drag.classList.remove("dragging");
      if (over) { over.classList.remove("drop-before"); list.insertBefore(drag, over); onDrop($$(itemSel, list).map(x => x.dataset.id)); }
      drag = over = null;
    };
    list.addEventListener("pointerup", end); list.addEventListener("pointercancel", end);
  }
  // give the items the same sort values they had, in their new order (other works keep theirs)
  async function reorder(table, all, ids, key = "id") {
    const items = ids.map(id => all.find(x => String(x[key]) === String(id)));
    const sorts = items.map(x => x.sort).sort((a, b) => a - b);
    for (let i = 1; i < sorts.length; i++) if (sorts[i] <= sorts[i - 1]) sorts[i] = sorts[i - 1] + 1;
    const changes = items.map((x, i) => ({ x, s: sorts[i] })).filter(c => c.x.sort !== c.s);
    for (const c of changes) {
      const { error } = await sb.from(table).update({ sort: c.s }).eq(key, c.x[key]);
      if (error) return toast("Order not saved: " + err(error), true);
      c.x.sort = c.s;
    }
    all.sort((a, b) => a.sort - b.sort);
    toast("Order saved");
  }

  /* ---------- works ---------- */
  function renderRoomFilter() {
    $("#room-filter").innerHTML = `<option value="">All rooms</option>` + st.rooms.map(r => `<option value="${r.id}">${ROOM_NAME[r.id] || r.id}</option>`).join("");
    $("#room-filter").value = st.room;
    $("#f-room").innerHTML = st.rooms.map(r => `<option value="${r.id}">${ROOM_NAME[r.id] || r.id}</option>`).join("");
  }
  $$("#wing-filter button").forEach(b => b.addEventListener("click", () => {
    st.wing = b.dataset.wing; $$("#wing-filter button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    $("#room-filter").hidden = st.wing !== "wearable"; renderWorks();
  }));
  $("#room-filter").addEventListener("change", e => { st.room = e.target.value; renderWorks(); });
  const shown = () => st.works.filter(w => w.wing === st.wing && (st.wing !== "wearable" || !st.room || w.room === st.room));
  function renderWorks() {
    const list = shown();
    $("#cards").innerHTML = list.map(w => `
      <li class="card${w.published ? "" : " is-hidden"}" data-id="${esc(w.id)}">
        <div class="ph">${w.image ? `<img src="${esc(thumb(w.image))}" alt="" loading="lazy">` : `<span>no photo yet</span>`}</div>
        ${w.published ? "" : `<span class="badge">hidden</span>`}
        <span class="handle" title="Drag to reorder" aria-hidden="true">⠿</span>
        <div class="meta"><div class="t">${esc(title(w))}</div>
          <div class="s">${w.wing === "wearable" ? esc(ROOM_NAME[w.room] || w.room || "") + " · " : ""}${w.year ? esc(w.year) + " · " : ""}${w.available ? "available" : "sold / not for sale"}</div></div>
      </li>`).join("") || `<li class="hint">Nothing here yet. Press “+ New work”.</li>`;
  }
  $("#cards").addEventListener("click", e => {
    if (e.target.closest(".handle")) return;
    const c = e.target.closest(".card"); if (c) openEditor(st.works.find(w => w.id === c.dataset.id));
  });
  sortable($("#cards"), ".card", ids => reorder("works", st.works, ids));

  function newId(wing) {
    const pre = wing === "wearable" ? "pl-" : wing === "wall" ? "w-" : "pr-";
    const n = Math.max(0, ...st.works.filter(w => w.id.startsWith(pre)).map(w => parseInt(w.id.slice(pre.length)) || 0)) + 1;
    return pre + String(n).padStart(pre === "pl-" ? 3 : 2, "0");
  }
  $("#new-work").addEventListener("click", () => {
    const wing = st.wing;
    openEditor({
      id: newId(wing), wing, room: wing === "wearable" ? (st.room || (st.rooms[0] && st.rooms[0].id)) : null,
      title: {}, story: null, year: "", image: null, gallery: [], materials: [], technique: wing === "print" ? "giclee" : wing === "wall" ? "collage" : "sewn",
      dimensions: "", available: true, price: null, frame: wing === "wall" ? "black" : null, published: true, _new: true
    });
  });

  /* ---------- editor ---------- */
  const ed = $("#editor");
  function langBlock(group, values, multiline) {
    const tabs = $(`.lang-tabs[data-group="${group}"]`);
    const box = $(`#${group}-fields`);
    tabs.innerHTML = LANGS.map((l, i) => `<button type="button" data-l="${l}" aria-pressed="${i === 0}" title="${LANG_NAME[l]}">${l.toUpperCase()}</button>`).join("");
    box.innerHTML = LANGS.map((l, i) => multiline
      ? `<textarea data-l="${l}" class="${i === 0 ? "on" : ""}" placeholder="${LANG_NAME[l]}">${esc(values[l] || "")}</textarea>`
      : `<input data-l="${l}" class="${i === 0 ? "on" : ""}" placeholder="${LANG_NAME[l]}" value="${esc(values[l] || "")}">`).join("");
    const mark = () => $$("button", tabs).forEach(b => b.classList.toggle("empty", !$(`[data-l="${b.dataset.l}"]`, box).value.trim()));
    tabs.onclick = e => { const b = e.target.closest("button"); if (!b) return;
      $$("button", tabs).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      $$("[data-l]", box).forEach(f => f.classList.toggle("on", f.dataset.l === b.dataset.l)); $(`[data-l="${b.dataset.l}"]`, box).focus(); };
    box.oninput = mark; mark();
  }
  const langValues = group => Object.fromEntries($$(`#${group}-fields [data-l]`).map(f => [f.dataset.l, f.value.trim()]).filter(([, v]) => v));
  $$("[data-copy]").forEach(b => b.addEventListener("click", () => {
    const g = b.dataset.copy, hr = $(`#${g}-fields [data-l="hr"]`).value;
    $$(`#${g}-fields [data-l]`).forEach(f => { if (!f.value.trim()) f.value = hr; });
    $(`#${g}-fields`).oninput();
  }));

  function setMain(url) { $("#main-img").src = url ? thumb(url) : ""; st.edit.image = url || null; $("#main-remove").hidden = !url; }
  function renderGallery() {
    $("#gallery").innerHTML = (st.edit.gallery || []).map((u, i) =>
      `<li data-id="${i}"><img src="${esc(thumb(u))}" alt=""><span class="handle" aria-hidden="true" style="position:absolute;inset:0;background:none"></span><button type="button" class="x" data-i="${i}" aria-label="Remove">×</button></li>`).join("");
  }
  function syncWing() {
    const wing = $("#f-wing").value;
    $("#room-wrap").hidden = wing !== "wearable";
    $("#frame-wrap").hidden = wing !== "wall";
  }
  $("#f-wing").addEventListener("change", syncWing);
  $("#close-editor").addEventListener("click", () => ed.close());

  function openEditor(w) {
    st.edit = JSON.parse(JSON.stringify(w)); if (w._new) st.edit._new = true;
    $("#ed-title").textContent = w._new ? "New work" : title(w);
    $("#ed-id").textContent = w.id;
    $("#f-wing").value = w.wing; $("#f-room").value = w.room || (st.rooms[0] && st.rooms[0].id) || "";
    $("#f-published").checked = w.published !== false;
    langBlock("title", typeof w.title === "string" ? { hr: w.title } : (w.title || {}), false);
    langBlock("story", w.story || {}, true);
    $("#f-year").value = w.year || ""; $("#f-dim").value = w.dimensions || ""; $("#f-frame").value = w.frame || "";
    $("#f-tech").innerHTML = Object.keys(TECHNIQUES).map(k => `<option value="${k}">${esc(TECHNIQUES[k].en)}</option>`).join("");
    $("#f-tech").value = w.technique || "";
    $("#f-mats").innerHTML = Object.keys(MATERIALS).map(k => `<label><input type="checkbox" value="${k}" ${w.materials && w.materials.includes(k) ? "checked" : ""}>${esc(MATERIALS[k].en)}</label>`).join("");
    $("#f-avail").checked = w.available !== false; $("#f-price").value = w.price ?? "";
    $("#delete-work").hidden = !!w._new;
    $("#ed-msg").textContent = "";
    setMain(w.image); renderGallery(); syncWing();
    ed.showModal(); ed.scrollTop = 0;
  }

  // main photo: click, drop or paste
  const drop = $("#drop-main");
  drop.addEventListener("click", () => $("#main-file").click());
  drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#main-file").click(); } });
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, () => drop.classList.remove("over")));
  drop.addEventListener("drop", e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadMain(f); });
  $("#main-file").addEventListener("change", e => { const f = e.target.files[0]; if (f) uploadMain(f); e.target.value = ""; });
  async function uploadMain(file) {
    const bar = $(".progress", drop), i = $("i", bar); bar.hidden = false; i.style.width = "0";
    try { const url = await uploadPhoto(file, st.edit.id, p => i.style.width = p + "%"); setMain(url); toast("Photo uploaded. Press Save to publish it."); }
    catch (e) { toast("Upload failed: " + err(e), true); }
    finally { setTimeout(() => bar.hidden = true, 400); }
  }
  $("#main-remove").addEventListener("click", () => setMain(null));
  $("#gallery-file").addEventListener("change", async e => {
    const files = [...e.target.files]; e.target.value = "";
    for (const f of files) {
      try { const url = await uploadPhoto(f, st.edit.id); st.edit.gallery = [...(st.edit.gallery || []), url]; renderGallery(); }
      catch (x) { toast("Upload failed: " + err(x), true); }
    }
    if (files.length) toast("Photos added. Press Save to publish them.");
  });
  $("#gallery").addEventListener("click", e => {
    const x = e.target.closest(".x"); if (!x) return;
    st.edit.gallery.splice(+x.dataset.i, 1); renderGallery();
  });
  sortable($("#gallery"), "li", order => { st.edit.gallery = order.map(i => st.edit.gallery[+i]); renderGallery(); });

  $("#work-form").addEventListener("submit", async e => {
    e.preventDefault();
    const t = langValues("title");
    if (!t.hr && !t.en) { $("#ed-msg").className = "msg ed-msg err"; $("#ed-msg").textContent = "Give the work a title (at least in Croatian or English)."; return; }
    const wing = $("#f-wing").value;
    const story = langValues("story");
    const row = {
      id: st.edit.id, wing, room: wing === "wearable" ? $("#f-room").value : null,
      title: t, story: Object.keys(story).length ? story : null,
      year: $("#f-year").value.trim() || null, dimensions: $("#f-dim").value.trim() || null,
      frame: wing === "wall" ? ($("#f-frame").value || null) : null,
      technique: $("#f-tech").value, materials: $$("#f-mats input:checked").map(i => i.value),
      available: $("#f-avail").checked, price: $("#f-price").value === "" ? null : Number($("#f-price").value),
      published: $("#f-published").checked, image: st.edit.image || null, gallery: st.edit.gallery || [],
      draw: { wearable: { hats: "hat", headpieces: "headpiece", bags: "bag", parasols: "parasol", textiles: "scarf", clothes: "dress" }[$("#f-room").value] || "hat", wall: "frame", print: "frame" }[wing]
    };
    if (st.edit._new) row.sort = Math.max(0, ...st.works.map(w => w.sort)) + 10;
    const btn = $("#save-work"); btn.disabled = true;
    const { data, error } = await sb.from("works").upsert(row).select().single();
    btn.disabled = false;
    if (error) { $("#ed-msg").className = "msg ed-msg err"; $("#ed-msg").textContent = "Not saved: " + err(error); return; }
    const i = st.works.findIndex(w => w.id === data.id);
    if (i >= 0) st.works[i] = data; else st.works.push(data);
    st.works.sort((a, b) => a.sort - b.sort);
    ed.close(); renderWorks(); renderSettings(); checkImport();
    toast("Saved. It's live on the site.");
  });
  $("#delete-work").addEventListener("click", async () => {
    if (!confirm(`Delete “${title(st.edit)}” from the site? This can't be undone.`)) return;
    const { error } = await sb.from("works").delete().eq("id", st.edit.id);
    if (error) return toast("Not deleted: " + err(error), true);
    // tidy up its photos in storage
    const { data: files } = await sb.storage.from(C.bucket).list(st.edit.id, { limit: 200 });
    const { data: small } = await sb.storage.from(C.bucket).list(st.edit.id + "/m", { limit: 200 });
    const paths = [...(files || []).filter(f => f.id).map(f => `${st.edit.id}/${f.name}`), ...(small || []).map(f => `${st.edit.id}/m/${f.name}`)];
    if (paths.length) await sb.storage.from(C.bucket).remove(paths);
    st.works = st.works.filter(w => w.id !== st.edit.id);
    if (st.settings.hero_works.includes(st.edit.id)) saveStage(st.settings.hero_works.filter(id => id !== st.edit.id));
    ed.close(); renderWorks(); toast("Deleted");
  });

  /* ---------- exhibitions ---------- */
  const KINDS = { solo: "Solo exhibition", show: "Exhibition", collab: "Collaboration", collection: "Works in a collection", lecture: "Lectures" };
  function renderEx() {
    $("#ex-list").innerHTML = st.ex.map(x => `
      <li class="row" data-id="${x.id}">
        <span class="handle" title="Drag to reorder" aria-hidden="true">⠿</span>
        <div class="thumb" data-photo="${x.id}" title="Click to change the photo">${x.image ? `<img src="${esc(thumb(x.image))}" alt="">` : "+ photo"}</div>
        <div>
          <div class="grid">
            <label>Year<input data-f="year" value="${esc(x.year)}"></label>
            <label>Title<input data-f="title" value="${esc(x.title)}"></label>
            <label>Venue<input data-f="venue" value="${esc(x.venue)}"></label>
            <label>City<input data-f="city" value="${esc(x.city)}"></label>
            <label>Kind<select data-f="kind">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}" ${x.kind === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          </div>
          <div class="acts">
            <button class="btn btn--small btn--red" data-save="${x.id}">Save</button>
            <label class="check"><input type="checkbox" data-f="published" ${x.published ? "checked" : ""}> Visible</label>
            ${x.image ? `<button class="link" data-nophoto="${x.id}">Remove photo</button>` : ""}
            <span class="grow"></span>
            <button class="link danger" data-del="${x.id}">Delete</button>
          </div>
        </div>
      </li>`).join("");
  }
  const exRow = id => st.ex.find(x => String(x.id) === String(id));
  $("#ex-list").addEventListener("click", async e => {
    const s = e.target.closest("[data-save]"), d = e.target.closest("[data-del]"), p = e.target.closest("[data-photo]"), np = e.target.closest("[data-nophoto]");
    if (s) {
      const li = s.closest(".row"), x = exRow(s.dataset.save);
      const upd = Object.fromEntries($$("[data-f]", li).map(f => [f.dataset.f, f.type === "checkbox" ? f.checked : f.value.trim()]));
      const { data, error } = await sb.from("exhibitions").update(upd).eq("id", x.id).select().single();
      if (error) return toast("Not saved: " + err(error), true);
      Object.assign(x, data); toast("Saved");
    }
    if (d) {
      const x = exRow(d.dataset.del);
      if (!confirm(`Delete “${x.title || x.venue || "this exhibition"}”?`)) return;
      const { error } = await sb.from("exhibitions").delete().eq("id", x.id);
      if (error) return toast("Not deleted: " + err(error), true);
      st.ex = st.ex.filter(y => y !== x); renderEx(); toast("Deleted");
    }
    if (np) {
      const x = exRow(np.dataset.nophoto);
      const { error } = await sb.from("exhibitions").update({ image: null }).eq("id", x.id);
      if (error) return toast(err(error), true);
      x.image = null; renderEx();
    }
    if (p) {
      const x = exRow(p.dataset.photo);
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
      inp.onchange = async () => {
        const f = inp.files[0]; if (!f) return;
        try {
          toast("Uploading…");
          const url = await uploadPhoto(f, "exhibitions");
          const { error } = await sb.from("exhibitions").update({ image: url }).eq("id", x.id);
          if (error) throw error;
          x.image = url; renderEx(); toast("Photo saved");
        } catch (e2) { toast("Upload failed: " + err(e2), true); }
      };
      inp.click();
    }
  });
  sortable($("#ex-list"), ".row", ids => reorder("exhibitions", st.ex, ids));
  $("#new-ex").addEventListener("click", async () => {
    const sort = Math.min(0, ...st.ex.map(x => x.sort)) - 10;            // new ones go on top
    const { data, error } = await sb.from("exhibitions").insert({ year: String(new Date().getFullYear()), title: "", venue: "", city: "", kind: "show", sort }).select().single();
    if (error) return toast(err(error), true);
    st.ex.unshift(data); renderEx(); $("#ex-list [data-f='title']").focus();
  });

  /* ---------- opening stage + contact ---------- */
  function renderSettings() {
    const s = st.settings;
    $("#stage-list").innerHTML = (s.hero_works || []).map(id => {
      const w = st.works.find(x => x.id === id); if (!w) return "";
      return `<li data-id="${esc(id)}"><span class="handle" aria-hidden="true" style="position:absolute;inset:0;background:none;width:auto;height:auto"></span>
        <img src="${esc(thumb(w.image))}" alt=""><span>${esc(title(w))}</span><button class="x" data-rm="${esc(id)}" aria-label="Remove">×</button></li>`;
    }).join("");
    $("#stage-pick").innerHTML = st.works.filter(w => w.image && w.published && !(s.hero_works || []).includes(w.id))
      .map(w => `<button type="button" data-add="${esc(w.id)}"><img src="${esc(thumb(w.image))}" alt="" loading="lazy"><span>${esc(title(w))}</span></button>`).join("");
    $("#s-email").value = s.contact_email || ""; $("#s-insta").value = s.instagram || "";
  }
  async function saveStage(list) {
    const { error } = await sb.from("settings").update({ hero_works: list }).eq("id", 1);
    if (error) return toast("Not saved: " + err(error), true);
    st.settings.hero_works = list; renderSettings(); toast("Opening stage saved");
  }
  $("#stage-list").addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (b) saveStage(st.settings.hero_works.filter(id => id !== b.dataset.rm)); });
  $("#stage-pick").addEventListener("click", e => { const b = e.target.closest("[data-add]"); if (b) saveStage([...(st.settings.hero_works || []), b.dataset.add]); });
  sortable($("#stage-list"), "li", ids => saveStage(ids));
  $("#settings-form").addEventListener("submit", async e => {
    e.preventDefault();
    const upd = { contact_email: $("#s-email").value.trim() || null, instagram: $("#s-insta").value.trim() || null };
    const { error } = await sb.from("settings").update(upd).eq("id", 1);
    const m = $("#settings-msg"); m.className = error ? "msg err" : "msg ok"; m.textContent = error ? err(error) : "Saved";
    if (!error) Object.assign(st.settings, upd);
  });

  /* ---------- admins ---------- */
  async function renderAdmins() {
    const { data, error } = await sb.from("admins").select("*").order("added_at");
    if (error) return;
    $("#admin-list").innerHTML = data.map(a => `<li><span>${esc(a.email)}${a.email.toLowerCase() === st.me.toLowerCase() ? " <small class='mono'>(you)</small>" : ""}</span>
      ${a.email.toLowerCase() === st.me.toLowerCase() ? "" : `<button class="link danger" data-rm-admin="${esc(a.email)}">Remove</button>`}</li>`).join("");
  }
  $("#admin-form").addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#admin-email").value.trim().toLowerCase();
    const { error } = await sb.from("admins").insert({ email });
    const m = $("#admin-msg"); m.className = error ? "msg err" : "msg ok";
    m.textContent = error ? (error.code === "23505" ? "Already on the list." : err(error)) : "Added. They can now create their password on the sign-in page.";
    if (!error) { $("#admin-email").value = ""; renderAdmins(); }
  });
  $("#admin-list").addEventListener("click", async e => {
    const b = e.target.closest("[data-rm-admin]"); if (!b || !confirm(`Remove ${b.dataset.rmAdmin} from the admins?`)) return;
    const { error } = await sb.from("admins").delete().eq("email", b.dataset.rmAdmin);
    if (error) return toast(err(error), true);
    renderAdmins();
  });

  /* ---------- one-time: copy the photos that live with the site files into Supabase ---------- */
  const isLocal = p => p && !/^https?:/.test(p);
  function checkImport() {
    const n = st.works.some(w => isLocal(w.image) || (w.gallery || []).some(isLocal)) || st.ex.some(x => isLocal(x.image));
    $("#import-box").hidden = !n;
  }
  $("#import-btn").addEventListener("click", async () => {
    const btn = $("#import-btn"), msg = $("#import-msg"); btn.disabled = true;
    const paths = [...new Set([
      ...st.works.flatMap(w => [w.image, ...(w.gallery || [])]), ...st.ex.map(x => x.image)
    ].filter(isLocal))];
    const map = {};
    let done = 0;
    for (const p of paths) {
      msg.className = "msg"; msg.textContent = `Copying ${++done} of ${paths.length}: ${p.split("/").pop()}`;
      try {
        const name = p.split("/").pop();
        const big = await fetch(src(p)).then(r => r.ok ? r.blob() : Promise.reject(new Error(p + " not found")));
        const smallPath = p.replace(/\/([^/]+)$/, "/m/$1");
        const small = /\/hd\//.test(p) ? await fetch(src(smallPath)).then(r => r.ok ? r.blob() : null).catch(() => null) : null;
        const type = big.type || "image/webp";
        const up = async (path, blob) => { const { error } = await sb.storage.from(C.bucket).upload(path, blob, { contentType: type, cacheControl: "31536000", upsert: true }); if (error) throw error; };
        await up(`site/${name}`, big);
        await up(`site/m/${name}`, small || await resize(new File([big], name, { type }), 1000));
        map[p] = publicUrl(`site/${name}`);
      } catch (e) { msg.className = "msg err"; msg.textContent = "Stopped: " + err(e); btn.disabled = false; return; }
    }
    msg.textContent = "Updating the works…";
    for (const w of st.works) {
      const upd = {};
      if (map[w.image]) upd.image = map[w.image];
      if ((w.gallery || []).some(g => map[g])) upd.gallery = w.gallery.map(g => map[g] || g);
      if (Object.keys(upd).length) { const { error } = await sb.from("works").update(upd).eq("id", w.id); if (!error) Object.assign(w, upd); }
    }
    for (const x of st.ex) if (map[x.image]) { const { error } = await sb.from("exhibitions").update({ image: map[x.image] }).eq("id", x.id); if (!error) x.image = map[x.image]; }
    msg.className = "msg ok"; msg.textContent = `Done: ${paths.length} photos are now stored in Supabase.`;
    btn.disabled = false; renderWorks(); renderEx(); renderSettings(); checkImport();
  });

  /* ---------- start ---------- */
  (async () => {
    const { data } = await sb.auth.getSession();
    if (data.session && !/type=recovery/.test(location.hash)) enter(data.session); else if (!/type=recovery/.test(location.hash)) showGate();
  })();
})();
